import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Flame } from '../Flame';
import * as feel from '../haptics';
import { ARROWS, DIRS, EXT_CHARS, LAYOUT, MOD_LABEL, ROWS, ROWS_EXT, Row, toKatakana } from '../kana';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { loadSettings, saveSettings, seenExtIntro, setSeenExtIntro } from '../settings';
import {
  Stats, countBad, loadRecent, loadStats, saveRecent, saveStats, updateStat, weakness,
} from '../storage';
import { recordPractice } from '../streak';
import { Colors, useStyles } from '../theme';

const QUICK_LENGTH = 10;
const FIX_ROUND = 20;
const KEY_ASPECT = 1.15;

type Script = 'hira' | 'kata';
// cycle: kolejne znaki po dotknięciu klawisza 小゛゜ (tylko dakuten, małe kana itd.)
type Item = { rowId: string; dir: number; script: Script; char: string; cycle?: string[] };
type Result = { char: string; wrong: boolean; ms: number };

function itemsFor(script: Script): Item[] {
  return ROWS.flatMap((r) =>
    r.keys.flatMap((k, dir) =>
      k ? [{ rowId: r.id, dir, script, char: script === 'kata' ? toKatakana(k) : k }] : []
    )
  );
}

const conv = (script: Script, c: string) => (script === 'kata' ? toKatakana(c) : c);

function extItemsFor(script: Script): Item[] {
  return EXT_CHARS.map((e) => ({
    rowId: e.rowId,
    dir: e.dir,
    script,
    char: conv(script, e.char),
    cycle: e.cycle ? e.cycle.map((c) => conv(script, c)) : undefined,
  }));
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildSession(mode: string, count: string, stats: Stats, recent: string[]): Item[] {
  // Poprawianie błędów: znaki z listy błędów (oba pisma razem)
  if (mode === 'fix') {
    const every = [
      ...itemsFor('hira'), ...itemsFor('kata'), ...extItemsFor('hira'), ...extItemsFor('kata'),
    ];
    const seen = new Set<string>();
    const bad = every.filter((i) => {
      if (!stats[i.char]?.bad || seen.has(i.char)) return false;
      seen.add(i.char);
      return true;
    });
    return shuffle(bad).slice(0, FIX_ROUND);
  }

  const script: Script = mode === 'kata' ? 'kata' : 'hira';
  const all = count === 'ext' ? extItemsFor(script) : itemsFor(script);

  // Wszystkie znaki, za każdym razem w nowej kolejności
  if (count === 'all') return shuffle(all);

  // 10 losowych: pomijamy znaki z ostatnich rund, słabsze mają większą szansę
  let pool = all.filter((i) => !recent.includes(i.char));
  if (pool.length < QUICK_LENGTH) pool = [...all];

  const picked: Item[] = [];
  while (picked.length < QUICK_LENGTH && pool.length > 0) {
    const total = pool.reduce((sum, i) => sum + weakness(stats[i.char]), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= weakness(stats[pool[idx].char]);
      if (r <= 0) break;
    }
    picked.push(pool.splice(idx, 1)[0]);
  }
  return shuffle(picked);
}

// 0 = dotyk, 1 = lewo, 2 = góra, 3 = prawo, 4 = dół
function direction(dx: number, dy: number): number {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return 0;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 1 : 3;
  return dy < 0 ? 2 : 4;
}

type KeyProps = {
  row: Row;
  show: (s: string) => string;
  hints: boolean;
  highlight: boolean;
  pressedDir: number | null;
  keyW: number;
  keyH: number;
  centerX: number; // środek klawisza na ekranie
  screenW: number;
  onPress: (rowId: string, dir: number | null) => void;
  onInput: (rowId: string, dir: number) => void;
};

function Key({
  row, show, hints, highlight, pressedDir, keyW, keyH, centerX, screenW, onPress, onInput,
}: KeyProps) {
  const { s } = useStyles(makeStyles);
  const handlers = useRef({ onPress, onInput });
  handlers.current = { onPress, onInput };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => handlers.current.onPress(row.id, 0),
      onPanResponderMove: (_, g) => handlers.current.onPress(row.id, direction(g.dx, g.dy)),
      onPanResponderRelease: (_, g) => {
        handlers.current.onPress(row.id, null);
        handlers.current.onInput(row.id, direction(g.dx, g.dy));
      },
      onPanResponderTerminate: () => handlers.current.onPress(row.id, null),
    })
  ).current;

  const k = row.keys;
  const active = pressedDir !== null;

  // Mały krzyżyk: pola są o połowę mniejsze od klawisza
  const cw = keyW * 0.5;
  const ch = keyH * 0.5;
  const gap = 4;

  // Przy krawędziach ekranu przesuń krzyżyk do środka
  let shift = 0;
  const leftEdge = centerX - cw / 2 - cw - gap;
  const rightEdge = centerX + cw / 2 + cw + gap;
  if (leftEdge < 6) shift = 6 - leftEdge;
  else if (rightEdge > screenW - 6) shift = screenW - 6 - rightEdge;

  const cx = keyW / 2 - cw / 2 + shift;
  const cy = keyH / 2 - ch / 2;
  const pos = [
    { left: cx, top: cy },
    { left: cx - cw - gap, top: cy },
    { left: cx, top: cy - ch - gap },
    { left: cx + cw + gap, top: cy },
    { left: cx, top: cy + ch + gap },
  ];

  const showHints = hints && !active;

  return (
    <View {...pan.panHandlers} style={[s.key, highlight && s.keyHi, active && s.keyActive]}>
      <Text style={s.keyMain}>{show(k[0]!)}</Text>
      {showHints && k[1] ? <Text style={[s.hint, s.hl]}>{show(k[1])}</Text> : null}
      {showHints && k[2] ? <Text style={[s.hint, s.hu]}>{show(k[2])}</Text> : null}
      {showHints && k[3] ? <Text style={[s.hint, s.hr]}>{show(k[3])}</Text> : null}
      {showHints && k[4] ? <Text style={[s.hint, s.hd]}>{show(k[4])}</Text> : null}

      {active &&
        k.map((c, d) =>
          c ? (
            <View
              key={d}
              pointerEvents="none"
              style={[s.cell, { width: cw, height: ch }, pos[d], pressedDir === d && s.cellOn]}
            >
              <Text style={[s.cellText, pressedDir === d && s.cellTextOn]}>{show(c)}</Text>
            </View>
          ) : null
        )}
    </View>
  );
}

export default function Practice() {
  const { s } = useStyles(makeStyles);
  const { mode: modeParam, count: countParam } = useLocalSearchParams<{ mode?: string; count?: string }>();
  const mode = modeParam ?? 'hira';
  const count = countParam ?? '10';
  const base = mode === 'fix' ? 'Review mistakes' : mode === 'kata' ? 'Katakana' : 'Hiragana';
  const label = count === 'ext' && mode !== 'fix' ? `${base} · Dakuten & small` : base;

  const router = useRouter();
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 24, 520);
  const tileW = boardWidth / 3;
  const keyW = tileW - 8;
  const keyH = keyW / KEY_ASPECT;
  const boardLeft = (width - boardWidth) / 2;

  const statsRef = useRef<Stats>({});
  const recentRef = useRef<Record<string, string[]>>({});
  const startRef = useRef(Date.now());
  const wrongRef = useRef(false);
  const hapticsRef = useRef(true);
  const lastKeyRef = useRef('');
  const recordedRef = useRef(false);
  const typedRef = useRef<number | null>(null);

  const [session, setSession] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [streak, setStreak] = useState(0);
  const [hints, setHints] = useState(true);
  const [days, setDays] = useState<{ count: number; increased: boolean } | null>(null);
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
  const [pressed, setPressed] = useState<{ rowId: string; dir: number } | null>(null);
  const [typed, setTypedState] = useState<number | null>(null); // krok cyklu 小゛゜ (null = jeszcze nic nie wpisano)
  const [badMsg, setBadMsg] = useState('');
  const [modDown, setModDown] = useState(false);
  const [intro, setIntro] = useState(false);

  // Podpowiedzi włączasz/wyłączasz w trakcie gry; ostatni wybór zostaje na następne rundy
  function toggleHints() {
    const next = !hints;
    setHints(next);
    loadSettings().then((cfg) => saveSettings({ ...cfg, hints: next }));
  }

  function setTyped(v: number | null) {
    typedRef.current = v;
    setTypedState(v);
  }

  function start() {
    const rkey = count === 'ext' ? `${mode}-ext` : mode;
    const recent = recentRef.current[rkey] ?? [];
    const items = buildSession(mode, count, statsRef.current, recent);

    // Zapamiętaj znaki z tej rundy, żeby w następnej się nie powtarzały
    if ((mode === 'hira' || mode === 'kata') && count !== 'all') {
      recentRef.current[rkey] = [...recent, ...items.map((i) => i.char)].slice(-2 * QUICK_LENGTH);
      saveRecent(recentRef.current);
    }

    setSession(items);
    setIndex(0);
    setResults([]);
    setStreak(0);
    setFeedback(null);
    setTyped(null);
    setBadMsg('');
    setDays(null);
    recordedRef.current = false;
  }

  useEffect(() => {
    Promise.all([loadStats(), loadRecent(), loadSettings(), seenExtIntro()]).then(([st, rc, cfg, seen]) => {
      statsRef.current = st;
      recentRef.current = rc;
      hapticsRef.current = cfg.haptics;
      setHints(cfg.hints);
      setIntro(count === 'ext' && mode !== 'fix' && !seen);
      start();
    });
  }, [mode, count]);

  // Nowy znak = start stopera
  useEffect(() => {
    startRef.current = Date.now();
    wrongRef.current = false;
  }, [session, index]);

  // Skończona runda = dzień ćwiczeń (seria dni)
  useEffect(() => {
    if (!session || session.length === 0 || index < session.length) return;
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordPractice().then((r) => setDays({ count: r.count, increased: r.increased }));
  }, [session, index]);

  function onPress(rowId: string, dir: number | null) {
    if (dir === null) {
      lastKeyRef.current = '';
    } else {
      const k = `${rowId}:${dir}`;
      if (k !== lastKeyRef.current) {
        lastKeyRef.current = k;
        feel.tick(hapticsRef.current);
      }
    }
    setPressed((prev) => {
      if (dir === null) return null;
      return prev && prev.rowId === rowId && prev.dir === dir ? prev : { rowId, dir };
    });
  }

  function fail(msg: string) {
    wrongRef.current = true;
    setStreak(0);
    feel.bad(hapticsRef.current);
    setBadMsg(msg);
    setFeedback('bad');
  }

  function succeed(item: Item) {
    const ms = Date.now() - startRef.current;
    const wrong = wrongRef.current;
    updateStat(statsRef.current, item.char, wrong, ms);
    saveStats(statsRef.current);

    // W trybie poprawiania znak wraca na koniec, dopóki nie zniknie z listy błędów
    if (mode === 'fix' && statsRef.current[item.char]?.bad) {
      setSession((prev) => (prev ? [...prev, item] : prev));
    }

    setResults((prev) => [...prev, { char: item.char, wrong, ms: Math.min(ms, 10000) }]);
    if (!wrong) setStreak((n) => n + 1);
    feel.good(hapticsRef.current);
    setBadMsg('');
    setFeedback('ok');
    setTimeout(() => {
      setFeedback(null);
      setTyped(null);
      setIndex((i) => i + 1);
    }, 250);
  }

  // Podpowiedź po błędzie przy znakach z klawiszem 小゛゜
  function baseHint(item: Item) {
    const first = item.cycle ? item.cycle[0] : item.char;
    return `Start with ${conv(item.script, first)}: ${DIRS[item.dir]} ${ARROWS[item.dir]}`;
  }

  function onInput(rowId: string, dir: number) {
    if (!session || feedback === 'ok') return;
    const item = session[index];
    if (!item) return;
    const hit = rowId === item.rowId && dir === item.dir;

    // Zwykły znak (także ー): jeden flick
    if (!item.cycle) {
      if (hit) succeed(item);
      else fail(`Here: ${DIRS[item.dir]} ${ARROWS[item.dir]}`);
      return;
    }

    // Znak z klawiszem 小゛゜: najpierw znak bazowy
    if (typedRef.current !== null) {
      fail(`Tap ${MOD_LABEL} to change it`);
    } else if (hit) {
      setTyped(0);
      setBadMsg('');
      setFeedback(null);
    } else {
      fail(baseHint(item));
    }
  }

  function onModifier() {
    if (!session || feedback === 'ok') return;
    const item = session[index];
    if (!item) return;
    const cur = typedRef.current;
    if (!item.cycle) {
      fail(`Here: ${DIRS[item.dir]} ${ARROWS[item.dir]}`);
      return;
    }
    if (cur === null) {
      fail(baseHint(item));
      return;
    }
    const next = (cur + 1) % item.cycle.length;
    setTyped(next);
    setFeedback(null);
    setBadMsg('');
    if (item.cycle[next] === item.char) succeed(item);
  }

  // Ładowanie
  if (!session) return <Screen style={s.screen} />;

  // Jednorazowe wyjaśnienie klawisza 小゛゜
  if (intro) {
    return (
      <Screen style={s.screen}>
        <View style={s.summary}>
          <Text style={s.introKey}>{MOD_LABEL}</Text>
          <Text style={s.sumTitle}>Dakuten, small kana and ー</Text>
          <Text style={s.sumLine}>
            These are typed in two steps. First flick the base character, then tap the {MOD_LABEL}
            key until it changes.
          </Text>
          <Text style={s.introEx}>は → 小゛゜ → ば → 小゛゜ → ぱ</Text>
          <Text style={s.sumLine}>
            The big character is your target. The one you have typed so far appears below it.
            ー is a plain flick right on the わ key.
          </Text>
          <Pressable
            style={s.sumBtn}
            onPress={() => {
              setSeenExtIntro();
              setIntro(false);
            }}
          >
            <Text style={s.sumBtnText}>Got it</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const extMode = session.some((i) => !!i.cycle) || count === 'ext';
  const boardRows = extMode ? ROWS_EXT : ROWS;

  const dayBadge = days ? (
    <View style={s.dayBadge}>
      <Flame size={58} pop={days.increased} />
      <Text style={s.dayCount}>
        {days.count} {days.count === 1 ? 'day' : 'days'} streak
      </Text>
      <Text style={s.dayNote}>{days.increased ? 'Streak extended!' : 'Keep it going tomorrow'}</Text>
    </View>
  ) : null;

  // Brak błędów do poprawienia
  if (mode === 'fix' && session.length === 0) {
    return (
      <Screen style={s.screen}>
        <View style={s.summary}>
          <Text style={s.sumTitle}>Nothing to fix</Text>
          <Text style={s.sumLine}>You have no open mistakes right now.</Text>
          <Pressable style={s.sumBtn} onPress={() => router.back()}>
            <Text style={s.sumBtnText}>Back to menu</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // Koniec rundy
  if (index >= session.length) {
    const badLeft = countBad(statsRef.current);

    if (mode === 'fix') {
      return (
        <Screen style={s.screen}>
          <View style={s.summary}>
            {dayBadge}
            <Text style={s.sumTitle}>{badLeft === 0 ? 'All mistakes fixed' : 'Round complete'}</Text>
            <Text style={s.sumLine}>
              {badLeft === 0
                ? 'Nothing left to fix. Nice work.'
                : `${badLeft} ${badLeft === 1 ? 'character' : 'characters'} still to fix`}
            </Text>
            {badLeft > 0 && (
              <Pressable style={s.sumBtn} onPress={start}>
                <Text style={s.sumBtnText}>Keep fixing</Text>
              </Pressable>
            )}
            <Pressable
              style={[s.sumBtn, badLeft > 0 && s.sumBtnAlt]}
              onPress={() => router.back()}
            >
              <Text style={[s.sumBtnText, badLeft > 0 && s.sumBtnTextAlt]}>Menu</Text>
            </Pressable>
          </View>
        </Screen>
      );
    }

    const firstTry = results.filter((r) => !r.wrong).length;
    const avg = results.length ? results.reduce((sum, r) => sum + r.ms, 0) / results.length / 1000 : 0;
    const hardest = [...results]
      .sort((a, b) => Number(b.wrong) - Number(a.wrong) || b.ms - a.ms)
      .slice(0, 3);

    return (
      <Screen style={s.screen}>
        <View style={s.summary}>
          {dayBadge}
          <Text style={s.sumTitle}>Round complete</Text>
          <Text style={s.sumLine}>
            {firstTry} / {results.length} correct on the first try
          </Text>
          <Text style={s.sumLine}>Average time: {avg.toFixed(1)} s</Text>

          {hardest.length > 0 && (
            <>
              <Text style={s.sumHead}>Needs the most attention</Text>
              <View style={s.sumRow}>
                {hardest.map((r) => (
                  <Text key={r.char} style={s.sumChar}>
                    {r.char}
                  </Text>
                ))}
              </View>
            </>
          )}

          <Pressable style={s.sumBtn} onPress={start}>
            <Text style={s.sumBtnText}>Practice again</Text>
          </Pressable>
          {badLeft > 0 && (
            <Pressable
              style={[s.sumBtn, s.sumBtnAlt]}
              onPress={() => router.replace('/mistakes' as any)}
            >
              <Text style={[s.sumBtnText, s.sumBtnTextAlt]}>Review mistakes ({badLeft})</Text>
            </Pressable>
          )}
          <Pressable style={[s.sumBtn, s.sumBtnAlt]} onPress={() => router.back()}>
            <Text style={[s.sumBtnText, s.sumBtnTextAlt]}>Menu</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const item = session[index];
  const show = (t: string) => (item.script === 'kata' ? toKatakana(t) : t);
  const progress = mode === 'fix' ? `${session.length - index} left` : `${index + 1} / ${session.length}`;

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.stat}>{progress}</Text>
        <Pressable
          onPress={toggleHints}
          style={[s.hintBtn, hints && s.hintBtnOn]}
          hitSlop={8}
        >
          <Text style={[s.hintBtnText, hints && s.hintBtnTextOn]}>Hints</Text>
        </Pressable>
      </View>

      <View style={s.center}>
        <Text style={s.label}>
          {label} · Streak {streak}
        </Text>
        <Text style={[s.target, feedback === 'ok' && s.ok, feedback === 'bad' && s.bad]}>
          {item.char}
        </Text>
        <View style={s.msgBox}>
          {feedback === 'bad' ? (
            <Text style={s.msg}>{badMsg}</Text>
          ) : typed !== null && item.cycle ? (
            <Text style={s.typed}>{item.cycle[typed]}</Text>
          ) : null}
        </View>
      </View>

      <View style={[s.board, { width: boardWidth }]}>
        {LAYOUT.map((line, i) => {
          const cells = extMode && i === 3 ? ['__mod', 'wa', null] : line;
          const lineActive = cells.some((id) => id !== null && id === pressed?.rowId);
          return (
            <View key={i} style={[s.line, lineActive && s.lineActive]}>
              {cells.map((id, j) => {
                if (id === '__mod') {
                  return (
                    <Pressable
                      key="mod"
                      style={[
                        s.key, s.keyMod,
                        feedback === 'bad' && typed !== null && s.keyHi,
                        modDown && s.keyModDown,
                      ]}
                      onPressIn={() => setModDown(true)}
                      onPressOut={() => setModDown(false)}
                      onPress={onModifier}
                    >
                      <Text style={s.keyModText}>{MOD_LABEL}</Text>
                    </Pressable>
                  );
                }
                const row = boardRows.find((r) => r.id === id);
                return row ? (
                  <Key
                    key={row.id}
                    row={row}
                    show={show}
                    hints={hints}
                    highlight={feedback === 'bad' && row.id === item.rowId && (typed === null || !item.cycle)}
                    pressedDir={pressed && pressed.rowId === row.id ? pressed.dir : null}
                    keyW={keyW}
                    keyH={keyH}
                    centerX={boardLeft + (j + 0.5) * tileW}
                    screenW={width}
                    onPress={onPress}
                    onInput={onInput}
                  />
                ) : (
                  <View key={j} style={s.empty} />
                );
              })}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
  },
  link: { color: colors.accent, fontSize: 15, padding: 6 },
  hintBtn: {
    borderWidth: 1.5, borderColor: colors.accent, borderRadius: 14,
    paddingVertical: 6, paddingHorizontal: 14, minWidth: 74, alignItems: 'center',
  },
  hintBtnOn: { backgroundColor: colors.accent },
  hintBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  hintBtnTextOn: { color: colors.onAccent },
  stat: { color: colors.textSoft, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  target: { color: colors.text, fontSize: 120 },
  ok: { color: colors.ok },
  bad: { color: colors.bad },
  msgBox: { height: 56, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  msg: { color: colors.warn, fontSize: 18, textAlign: 'center' },
  typed: { color: colors.accent, fontSize: 44 },
  keyMod: { backgroundColor: colors.cell },
  keyModDown: { backgroundColor: colors.cellOn },
  keyModText: { color: colors.text, fontSize: 22 },
  introKey: { color: colors.accent, fontSize: 56, marginBottom: 12 },
  introEx: { color: colors.text, fontSize: 22, marginVertical: 14, textAlign: 'center' },
  board: { paddingBottom: 12 },
  line: { flexDirection: 'row', zIndex: 0 },
  lineActive: { zIndex: 10 },
  key: {
    flex: 1, aspectRatio: KEY_ASPECT, margin: 4, borderRadius: 14,
    backgroundColor: colors.key, alignItems: 'center', justifyContent: 'center',
  },
  keyActive: { zIndex: 10 },
  keyHi: { borderWidth: 3, borderColor: colors.warn },
  keyMain: { color: colors.text, fontSize: 34 },
  empty: { flex: 1, margin: 4 },
  hint: { position: 'absolute', color: colors.keyHint, fontSize: 13 },
  hl: { left: 8, top: '50%', marginTop: -9 },
  hu: { top: 4, left: 0, right: 0, textAlign: 'center' },
  hr: { right: 8, top: '50%', marginTop: -9 },
  hd: { bottom: 4, left: 0, right: 0, textAlign: 'center' },
  cell: {
    position: 'absolute', backgroundColor: colors.cell, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cellOn: { backgroundColor: colors.cellOn },
  cellText: { color: colors.text, fontSize: 26 },
  cellTextOn: { color: colors.onAccent },
  summary: { flex: 1, width: '100%', maxWidth: 420, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sumTitle: { color: colors.text, fontSize: 30, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  sumLine: { color: colors.textSoft, fontSize: 17, marginBottom: 6, textAlign: 'center' },
  dayBadge: { alignItems: 'center', marginBottom: 12 },
  dayCount: { color: colors.warn, fontSize: 20, fontWeight: '700' },
  dayNote: { color: colors.muted, fontSize: 14, marginTop: 2 },
  sumHead: { color: colors.muted, fontSize: 14, marginTop: 20 },
  sumRow: { flexDirection: 'row', marginTop: 6, marginBottom: 20 },
  sumChar: { color: colors.text, fontSize: 52, marginHorizontal: 12 },
  sumBtn: {
    width: '100%', backgroundColor: colors.accent, borderRadius: 16,
    paddingVertical: 15, alignItems: 'center', marginTop: 10,
  },
  sumBtnAlt: { backgroundColor: colors.key },
  sumBtnText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
  sumBtnTextAlt: { color: colors.text },
});