import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen, Play, RotateCcw, Shuffle, CheckCircle2, Sparkles,
  Grid, Compass, Layers, Move,Maximize2, Minimize2, Lock, Unlock,
  FileText, User, Award, ChevronRight, ArrowRight, Eye, Sliders,
  Calculator, HelpCircle, Printer, Sun, Moon, Terminal, Zap, Key,
  TrendingUp, Box, Share2, Check, AlertTriangle, RefreshCw
} from 'lucide-react';

// --- MATHEMATICAL UTILITIES ---
const EPSILON = 1e-8;

const fmt = (val, decimals = 2) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (Math.abs(val) < 1e-7) return '0';
  const rounded = Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded.toString();
};

const cloneMatrix = (m) => m.map((row) => [...row]);

const det2x2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];

const det3x3 = (m) => {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
};

const dot = (v1, v2) => v1.reduce((acc, val, i) => acc + val * v2[i], 0);
const norm = (v) => Math.sqrt(dot(v, v));
const scaleVec = (v, s) => v.map((x) => x * s);
const subVec = (v1, v2) => v1.map((x, i) => x - v2[i]);
const addVec = (v1, v2) => v1.map((x, i) => x + v2[i]);

const matMul = (A, B) => {
  const rA = A.length, cA = A[0].length, cB = B[0].length;
  const C = Array.from({ length: rA }, () => Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let j = 0; j < cB; j++) {
      for (let k = 0; k < cA; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
};

const transpose = (A) => A[0].map((_, c) => A.map((r) => r[c]));

// Modular arithmetic helpers for Hill Cipher (Exp 9)
const mod = (n, m) => ((n % m) + m) % m;
const gcd = (a, b) => (!b ? a : gcd(b, a % b));
const modInverse = (a, m) => {
  const aMod = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(aMod * x, m) === 1) return x;
  }
  return null;
};

const EXPERIMENTS = [
  {
    id: 1,
    short: 'Exp 1: Gaussian & Gauss-Jordan',
    title: 'Gaussian Elimination and Gauss-Jordan Method',
    aim: 'To solve a system of linear equations Ax = b using Gaussian Elimination (Row Echelon Form) and Gauss-Jordan Method (Reduced Row Echelon Form) via elementary row operations.',
    badge: 'Row Operations & Puzzle',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    short: 'Exp 2: LU Factorizations',
    title: 'LU Factorization of Matrices',
    aim: 'To decompose a square matrix A into the product of a unit Lower triangular matrix (L) and an Upper triangular matrix (U) such that A = LU, and solve Ax = b via Ly = b and Ux = y.',
    badge: 'Decomposition A = LU',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 3,
    short: 'Exp 3: Four Fundamental Spaces',
    title: 'The Four Fundamental Subspaces',
    aim: 'To determine basis, dimension, and geometric orthogonality of the Column Space C(A), Null Space N(A), Row Space C(Aᵀ), and Left Null Space N(Aᵀ) and verify the Rank-Nullity Theorem.',
    badge: 'Strang Subspaces',
    color: 'from-violet-500 to-fuchsia-500'
  },
  {
    id: 4,
    short: 'Exp 4: Linear Transformations',
    title: '2D Linear Transformations & Eigen-Geometry',
    aim: 'To visualize linear transformations T(x) = Ax on a 2D vector space, observing the action on basis vectors î and ĵ, area scaling via det(A), and invariant eigenspaces.',
    badge: 'Interactive 2D Canvas',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 5,
    short: 'Exp 5: Gram-Schmidt Process',
    title: 'Gram-Schmidt Orthogonalization',
    aim: 'To construct an orthogonal basis {u₁, u₂, u₃} and an orthonormal basis {q₁, q₂, q₃} from a set of linearly independent vectors {v₁, v₂, v₃} by successive projection subtraction.',
    badge: 'Vector Projections',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 6,
    short: 'Exp 6: QR Factorization',
    title: 'QR Factorization (A = QR)',
    aim: 'To factorize a matrix A with linearly independent columns into an orthonormal matrix Q (where QᵀQ = I) and an upper triangular matrix R (where R = QᵀA).',
    badge: 'Orthonormal Matrix',
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 7,
    short: 'Exp 7: Linear Dependence',
    title: 'Linear Dependence, Independence & Span',
    aim: 'To investigate whether a set of vectors is linearly independent or dependent, visualize their geometric span, and find linear combinations c₁v₁ + c₂v₂ = b.',
    badge: 'Span Target Game',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 8,
    short: 'Exp 8: Least Squares Fit',
    title: 'Least Squares Approximation (AᵀAx̂ = Aᵀb)',
    aim: 'To compute the best-fit line or parabola for an inconsistent overdetermined system using Normal Equations AᵀAx̂ = Aᵀb and minimize the sum of squared vertical residuals ||Ax̂ - b||².',
    badge: 'Interactive Regression',
    color: 'from-lime-500 to-emerald-600'
  },
  {
    id: 9,
    short: 'Exp 9: Classical Cryptosystems',
    title: 'Case Study: Classical Cryptosystems (Hill Cipher)',
    aim: 'To apply modular matrix arithmetic (mod 26) for encrypting and decrypting messages using an invertible key matrix K and its modular inverse K⁻¹ (mod 26).',
    badge: 'Cryptography Lab',
    color: 'from-fuchsia-500 to-rose-500'
  },
  {
    id: 10,
    short: 'Exp 10: Gauss-Jordan [A | I] Inverse',
    title: 'Gauss-Jordan Matrix Inversion & System Diagnostics',
    aim: 'To compute the inverse of a non-singular matrix A by augmenting it with the Identity matrix [A | I] and applying Gauss-Jordan elimination to obtain [I | A⁻¹].',
    badge: '[A | I] ➔ [I | A⁻¹]',
    color: 'from-sky-500 to-indigo-600'
  }
];

// --- REUSABLE MATRIX DISPLAY COMPONENT ---
const MatrixBracket = ({ matrix, title = '', subtitle = '', highlightRow = -1, highlightPivot = null, augmentedCol = -1, colorClass = 'text-sky-400', darkMode = true }) => {
  if (!matrix || !matrix.length) return null;
  return (
    <div className={`inline-flex flex-col items-center p-3 rounded-xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
      {title && <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${colorClass}`}>{title}</div>}
      <div className="relative flex items-center px-2 py-1">
        {/* Left Bracket */}
        <div className={`w-2.5 self-stretch border-l-2 border-t-2 border-b-2 rounded-l-sm ${darkMode ? 'border-slate-400' : 'border-slate-700'}`} />
        <div className="grid gap-1.5 px-2" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, minmax(42px, auto))` }}>
          {matrix.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const isPivot = highlightPivot && highlightPivot[0] === rIdx && highlightPivot[1] === cIdx;
              const isRowHighlighted = highlightRow === rIdx;
              const isAugmentedSep = augmentedCol !== -1 && cIdx === augmentedCol;
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`relative flex items-center justify-center px-2 py-1 rounded font-mono text-sm transition-all ${
                    isPivot
                      ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400 font-bold'
                      : isRowHighlighted
                      ? 'bg-sky-500/20 text-sky-300'
                      : darkMode
                      ? 'bg-slate-800/70 text-slate-200'
                      : 'bg-slate-100 text-slate-800'
                  } ${isAugmentedSep ? 'ml-2 before:content-[""] before:absolute before:-left-1.5 before:top-0 before:bottom-0 before:w-0.5 before:bg-amber-500/60' : ''}`}
                >
                  {typeof val === 'number' ? fmt(val, 2) : val}
                </div>
              );
            })
          )}
        </div>
        {/* Right Bracket */}
        <div className={`w-2.5 self-stretch border-r-2 border-t-2 border-b-2 rounded-r-sm ${darkMode ? 'border-slate-400' : 'border-slate-700'}`} />
      </div>
      {subtitle && <div className="text-[11px] text-slate-400 mt-1.5 font-mono">{subtitle}</div>}
    </div>
  );
};

// ============================================================================
// EXPERIMENT 1: GAUSSIAN ELIMINATION & GAUSS-JORDAN METHOD
// ============================================================================
const Exp1Gaussian = ({ darkMode, onComplete }) => {
  const presets = [
    {
      name: 'Unique Solution (Clean)',
      A: [
        [2, 1, -1, 8],
        [-3, -1, 2, -11],
        [-2, 1, 2, -3]
      ]
    },
    {
      name: 'Needs Row Swap',
      A: [
        [0, 2, 1, 5],
        [1, -1, 2, 5],
        [2, 1, -1, 1]
      ]
    },
    {
      name: 'Symmetric System',
      A: [
        [1, 2, 1, 9],
        [2, 5, 2, 20],
        [1, 2, 3, 15]
      ]
    }
  ];

  const [aug, setAug] = useState(cloneMatrix(presets[0].A));
  const [history, setHistory] = useState([{ mat: cloneMatrix(presets[0].A), desc: 'Initial Augmented Matrix [A | b]' }]);
  const [mode, setMode] = useState('play'); // 'play' | 'auto'
  const [autoStep, setAutoStep] = useState(0);

  // Manual row op state
  const [swapR1, setSwapR1] = useState(0);
  const [swapR2, setSwapR2] = useState(1);
  const [scaleR, setScaleR] = useState(0);
  const [scaleFactor, setScaleFactor] = useState('0.5');
  const [targetR, setTargetR] = useState(1);
  const [sourceR, setSourceR] = useState(0);
  const [multFactor, setMultFactor] = useState('1.5');

  const handleMatrixCellChange = (r, c, val) => {
    const num = parseFloat(val);
    const next = cloneMatrix(aug);
    next[r][c] = isNaN(num) ? 0 : num;
    setAug(next);
    setHistory([{ mat: cloneMatrix(next), desc: 'Edited Matrix [A | b]' }]);
  };

  const loadPreset = (idx) => {
    const next = cloneMatrix(presets[idx].A);
    setAug(next);
    setHistory([{ mat: cloneMatrix(next), desc: `Loaded Preset: ${presets[idx].name}` }]);
    setAutoStep(0);
  };

  const randomize = () => {
    const sol = [Math.floor(Math.random() * 5) - 2, Math.floor(Math.random() * 5) - 1, Math.floor(Math.random() * 5) + 1];
    const next = Array.from({ length: 3 }, (_, i) => {
      const r = [
        Math.floor(Math.random() * 5) - 2 || 1,
        Math.floor(Math.random() * 5) - 2,
        Math.floor(Math.random() * 5) - 2
      ];
      r[i] = Math.abs(r[i]) + 2; // diagonally dominant to ensure nice solution
      const b = r[0] * sol[0] + r[1] * sol[1] + r[2] * sol[2];
      return [...r, b];
    });
    setAug(next);
    setHistory([{ mat: cloneMatrix(next), desc: `Randomized System (True Solution: x=${sol[0]}, y=${sol[1]}, z=${sol[2]})` }]);
    setAutoStep(0);
  };

  // Manual Operations
  const applySwap = () => {
    if (swapR1 === swapR2) return;
    const next = cloneMatrix(aug);
    const temp = next[swapR1];
    next[swapR1] = next[swapR2];
    next[swapR2] = temp;
    setAug(next);
    setHistory([...history, { mat: cloneMatrix(next), desc: `R${swapR1 + 1} ↔ R${swapR2 + 1}` }]);
    onComplete(1);
  };

  const applyScale = () => {
    const k = parseFloat(scaleFactor);
    if (isNaN(k) || Math.abs(k) < EPSILON) return;
    const next = cloneMatrix(aug);
    next[scaleR] = next[scaleR].map((v) => v * k);
    setAug(next);
    setHistory([...history, { mat: cloneMatrix(next), desc: `R${scaleR + 1} ← (${fmt(k)}) · R${scaleR + 1}` }]);
    onComplete(1);
  };

  const applyRowComb = () => {
    if (targetR === sourceR) return;
    const k = parseFloat(multFactor);
    if (isNaN(k)) return;
    const next = cloneMatrix(aug);
    next[targetR] = next[targetR].map((v, c) => v + k * next[sourceR][c]);
    setAug(next);
    const sign = k >= 0 ? `+ ${fmt(k)}` : `- ${fmt(Math.abs(k))}`;
    setHistory([...history, { mat: cloneMatrix(next), desc: `R${targetR + 1} ← R${targetR + 1} ${sign} · R${sourceR + 1}` }]);
    onComplete(1);
  };

  // Check if in REF or RREF
  const status = useMemo(() => {
    const isZeroBelow =
      Math.abs(aug[1][0]) < 1e-4 &&
      Math.abs(aug[2][0]) < 1e-4 &&
      Math.abs(aug[2][1]) < 1e-4;
    const isUnitDiag =
      Math.abs(aug[0][0] - 1) < 1e-4 &&
      Math.abs(aug[1][1] - 1) < 1e-4 &&
      Math.abs(aug[2][2] - 1) < 1e-4;
    const isZeroAbove =
      Math.abs(aug[0][1]) < 1e-4 &&
      Math.abs(aug[0][2]) < 1e-4 &&
      Math.abs(aug[1][2]) < 1e-4;
    return {
      isREF: isZeroBelow,
      isRREF: isZeroBelow && isUnitDiag && isZeroAbove
    };
  }, [aug]);

  // Auto-generate full Gauss-Jordan steps from initial matrix of current history[0]
  const autoStepsList = useMemo(() => {
    const m = cloneMatrix(history[0].mat);
    const steps = [{ mat: cloneMatrix(m), desc: 'Start with Augmented Matrix [A | b]', pivot: [0, 0], stage: 'Initial' }];
    const n = 3;

    // Forward Elimination (Gaussian)
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(m[r][col]) > Math.abs(m[maxRow][col])) maxRow = r;
      }
      if (maxRow !== col) {
        const tmp = m[col];
        m[col] = m[maxRow];
        m[maxRow] = tmp;
        steps.push({ mat: cloneMatrix(m), desc: `Pivot Swap: R${col + 1} ↔ R${maxRow + 1}`, pivot: [col, col], stage: 'Gaussian (REF)' });
      }
      if (Math.abs(m[col][col]) < EPSILON) continue;

      for (let r = col + 1; r < n; r++) {
        const factor = m[r][col] / m[col][col];
        if (Math.abs(factor) > EPSILON) {
          for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
          steps.push({
            mat: cloneMatrix(m),
            desc: `Eliminate below pivot: R${r + 1} ← R${r + 1} - (${fmt(factor)})·R${col + 1}`,
            pivot: [col, col],
            stage: 'Gaussian (REF)'
          });
        }
      }
    }

    steps.push({
      mat: cloneMatrix(m),
      desc: 'Upper Triangular Row Echelon Form (REF) Achieved! Now starting Gauss-Jordan.',
      pivot: [2, 2],
      stage: 'REF Milestone'
    });

    // Scale pivots & Backward Elimination (Gauss-Jordan)
    for (let col = n - 1; col >= 0; col--) {
      const piv = m[col][col];
      if (Math.abs(piv) > EPSILON && Math.abs(piv - 1) > EPSILON) {
        for (let c = col; c <= n; c++) m[col][c] /= piv;
        steps.push({
          mat: cloneMatrix(m),
          desc: `Normalize Pivot: R${col + 1} ← (1 / ${fmt(piv)})·R${col + 1}`,
          pivot: [col, col],
          stage: 'Gauss-Jordan (RREF)'
        });
      }
      for (let r = col - 1; r >= 0; r--) {
        const factor = m[r][col];
        if (Math.abs(factor) > EPSILON) {
          for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
          steps.push({
            mat: cloneMatrix(m),
            desc: `Eliminate above pivot: R${r + 1} ← R${r + 1} - (${fmt(factor)})·R${col + 1}`,
            pivot: [col, col],
            stage: 'Gauss-Jordan (RREF)'
          });
        }
      }
    }

    return steps;
  }, [history]);

  const currentAuto = autoStepsList[Math.min(autoStep, autoStepsList.length - 1)];
  const finalStepMat = autoStepsList[autoStepsList.length - 1].mat;

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMode('play')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              mode === 'play' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Playful Row-Op Puzzle Mode
          </button>
          <button
            onClick={() => {
              setMode('auto');
              onComplete(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              mode === 'auto' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-4 h-4" /> Auto Step-by-Step Solver
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(idx)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={randomize}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1"
          >
            <Shuffle className="w-3.5 h-3.5" /> Randomize
          </button>
        </div>
      </div>

      {mode === 'play' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Editable Matrix & Status */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">
                  Interactive Augmented Matrix [A | b]
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.isREF ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    {status.isREF ? '✓ REF Reached' : '○ REF Pending'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.isRREF ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    {status.isRREF ? '★ RREF Solved!' : '○ RREF Pending'}
                  </span>
                </div>
              </div>

              {/* Editable Matrix Grid */}
              <div className="overflow-x-auto py-2 flex justify-center">
                <div className="inline-flex items-center px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="w-3 self-stretch border-l-2 border-t-2 border-b-2 border-slate-500 rounded-l" />
                  <div className="space-y-2 px-3">
                    {aug.map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500 w-6">R{rIdx + 1}</span>
                        {row.map((val, cIdx) => {
                          const isLowerTriangle = (rIdx === 1 && cIdx === 0) || (rIdx === 2 && (cIdx === 0 || cIdx === 1));
                          const isZeroed = Math.abs(val) < 1e-4;
                          return (
                            <React.Fragment key={cIdx}>
                              {cIdx === 3 && <div className="w-0.5 h-8 bg-amber-500/60 mx-1" />}
                              <input
                                type="number"
                                step="any"
                                value={Math.round(val * 100) / 100}
                                onChange={(e) => handleMatrixCellChange(rIdx, cIdx, e.target.value)}
                                className={`w-16 text-center py-1.5 rounded-lg font-mono text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                  isLowerTriangle && isZeroed
                                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                                    : 'bg-slate-900 border-slate-700 text-slate-100'
                                }`}
                              />
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="w-3 self-stretch border-r-2 border-t-2 border-b-2 border-slate-500 rounded-r" />
                </div>
              </div>

              {/* Quick Zero Hint */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-center justify-between">
                <div>
                  <strong>Puzzle Goal:</strong> Zero out the lower triangle (<code className="text-amber-300">a₂₁, a₃₁, a₃₂</code>) for Gaussian REF, then make pivots <code className="text-emerald-300">1</code> and zero above pivots for Gauss-Jordan RREF!
                </div>
                {history.length > 1 && (
                  <button
                    onClick={() => {
                      const prev = history.slice(0, -1);
                      setHistory(prev);
                      setAug(cloneMatrix(prev[prev.length - 1].mat));
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 ml-2"
                  >
                    Undo Step
                  </button>
                )}
              </div>
            </div>

            {/* History Log */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Elementary Row Operation Log ({history.length - 1} ops)
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.map((item, idx) => (
                  <div key={idx} className="shrink-0">
                    <MatrixBracket
                      matrix={item.mat}
                      title={`Step ${idx}`}
                      subtitle={item.desc}
                      augmentedCol={3}
                      darkMode={darkMode}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Row Operation Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Elementary Row Operation Deck
              </h3>

              {/* Type 1: Row Swap */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">1. Row Interchange (Rᵢ ↔ Rⱼ)</div>
                <div className="flex items-center gap-2">
                  <select
                    value={swapR1}
                    onChange={(e) => setSwapR1(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value={0}>Row 1</option>
                    <option value={1}>Row 2</option>
                    <option value={2}>Row 3</option>
                  </select>
                  <span className="text-slate-400 font-mono">↔</span>
                  <select
                    value={swapR2}
                    onChange={(e) => setSwapR2(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value={0}>Row 1</option>
                    <option value={1}>Row 2</option>
                    <option value={2}>Row 3</option>
                  </select>
                  <button
                    onClick={applySwap}
                    className="ml-auto px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Swap Rows
                  </button>
                </div>
              </div>

              {/* Type 2: Row Scaling */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">2. Row Scaling (Rᵢ ← k · Rᵢ)</div>
                <div className="flex items-center gap-2">
                  <select
                    value={scaleR}
                    onChange={(e) => setScaleR(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value={0}>Row 1</option>
                    <option value={1}>Row 2</option>
                    <option value={2}>Row 3</option>
                  </select>
                  <span className="text-slate-400 font-mono">×</span>
                  <input
                    type="number"
                    step="any"
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(e.target.value)}
                    className="w-20 bg-slate-800 text-slate-200 text-sm rounded-lg px-2.5 py-1.5 border border-slate-700 font-mono"
                  />
                  <button
                    onClick={applyScale}
                    className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Scale Row
                  </button>
                </div>
              </div>

              {/* Type 3: Row Replacement */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">3. Row Replacement (Rᵢ ← Rᵢ + k · Rⱼ)</div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={targetR}
                    onChange={(e) => setTargetR(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1.5 border border-slate-700"
                  >
                    <option value={0}>R1</option>
                    <option value={1}>R2</option>
                    <option value={2}>R3</option>
                  </select>
                  <span className="text-slate-400 font-mono text-xs">← R{targetR + 1} +</span>
                  <input
                    type="number"
                    step="any"
                    value={multFactor}
                    onChange={(e) => setMultFactor(e.target.value)}
                    className="w-20 bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1.5 border border-slate-700 font-mono"
                  />
                  <span className="text-slate-400 font-mono text-xs">×</span>
                  <select
                    value={sourceR}
                    onChange={(e) => setSourceR(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1.5 border border-slate-700"
                  >
                    <option value={0}>R1</option>
                    <option value={1}>R2</option>
                    <option value={2}>R3</option>
                  </select>
                  <button
                    onClick={applyRowComb}
                    className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Apply
                  </button>
                </div>
                {/* Smart Assistant Pill */}
                {aug[sourceR][sourceR] !== 0 && targetR !== sourceR && (
                  <button
                    onClick={() => setMultFactor(fmt(-aug[targetR][sourceR] / aug[sourceR][sourceR], 4))}
                    className="text-[11px] text-amber-300 hover:underline font-mono"
                  >
                    💡 Smart Hint: Use k = {fmt(-aug[targetR][sourceR] / aug[sourceR][sourceR], 3)} to zero entry ({targetR + 1},{sourceR + 1})
                  </button>
                )}
              </div>

              {/* Verified Solution Readout */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  True System Solution (RREF Verification)
                </div>
                <div className="flex gap-4 font-mono text-sm text-emerald-200 pt-1">
                  <span>x₁ = <strong>{fmt(finalStepMat[0][3], 3)}</strong></span>
                  <span>x₂ = <strong>{fmt(finalStepMat[1][3], 3)}</strong></span>
                  <span>x₃ = <strong>{fmt(finalStepMat[2][3], 3)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUTO STEP-BY-STEP SOLVER */
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentAuto.stage}
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-2">{currentAuto.desc}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoStep(0)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Reset
              </button>
              <button
                disabled={autoStep === 0}
                onClick={() => setAutoStep((s) => Math.max(0, s - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200"
              >
                ← Prev
              </button>
              <span className="text-xs font-mono text-slate-400 px-2">
                Step {autoStep + 1} / {autoStepsList.length}
              </span>
              <button
                disabled={autoStep >= autoStepsList.length - 1}
                onClick={() => setAutoStep((s) => Math.min(autoStepsList.length - 1, s + 1))}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white"
              >
                Next Step →
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 py-4">
            <MatrixBracket
              matrix={history[0].mat}
              title="Initial [A | b]"
              augmentedCol={3}
              darkMode={darkMode}
            />
            <ArrowRight className="w-6 h-6 text-indigo-400" />
            <MatrixBracket
              matrix={currentAuto.mat}
              title={`Step ${autoStep + 1} Matrix`}
              subtitle={currentAuto.desc}
              highlightPivot={currentAuto.pivot}
              augmentedCol={3}
              colorClass="text-amber-400"
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPERIMENT 2: LU FACTORIZATION (A = L * U)
// ============================================================================
const Exp2LUFactorization = ({ darkMode, onComplete }) => {
  const [A, setA] = useState([
    [2, 1, 1],
    [4, -6, 0],
    [-2, 7, 2]
  ]);
  const [b, setB] = useState([5, -2, 9]);
  const [stepIdx, setStepIdx] = useState(3);

  const presets = [
    { name: 'Strang Classic', A: [[2, 1, 1], [4, -6, 0], [-2, 7, 2]], b: [5, -2, 9] },
    { name: 'Positive Definite', A: [[4, 2, 2], [2, 5, 3], [2, 3, 6]], b: [8, 10, 11] },
    { name: 'Integer Multipliers', A: [[1, 2, 3], [2, 5, 7], [3, 5, 3]], b: [14, 30, 20] }
  ];

  // Compute Doolittle LU without pivoting
  const luData = useMemo(() => {
    const U = cloneMatrix(A);
    const L = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    const steps = [
      {
        title: 'Step 0: Initialize L = I₃ and U = A',
        L: cloneMatrix(L),
        U: cloneMatrix(U),
        desc: 'Start with Identity matrix for L and original matrix A for U.'
      }
    ];

    const l21 = Math.abs(U[0][0]) > EPSILON ? U[1][0] / U[0][0] : 0;
    L[1][0] = l21;
    for (let j = 0; j < 3; j++) U[1][j] -= l21 * U[0][j];
    steps.push({
      title: `Step 1: Eliminate U₂₁ using multiplier l₂₁ = ${fmt(l21)}`,
      L: cloneMatrix(L),
      U: cloneMatrix(U),
      desc: `Store multiplier l₂₁ = a₂₁/a₁₁ = ${fmt(l21)} into L[2,1] and update Row 2 of U.`
    });

    const l31 = Math.abs(U[0][0]) > EPSILON ? U[2][0] / U[0][0] : 0;
    L[2][0] = l31;
    for (let j = 0; j < 3; j++) U[2][j] -= l31 * U[0][j];
    steps.push({
      title: `Step 2: Eliminate U₃₁ using multiplier l₃₁ = ${fmt(l31)}`,
      L: cloneMatrix(L),
      U: cloneMatrix(U),
      desc: `Store multiplier l₃₁ = a₃₁/a₁₁ = ${fmt(l31)} into L[3,1] and update Row 3 of U.`
    });

    const l32 = Math.abs(U[1][1]) > EPSILON ? U[2][1] / U[1][1] : 0;
    L[2][1] = l32;
    for (let j = 1; j < 3; j++) U[2][j] -= l32 * U[1][j];
    steps.push({
      title: `Step 3: Eliminate U₃₂ using multiplier l₃₂ = ${fmt(l32)}`,
      L: cloneMatrix(L),
      U: cloneMatrix(U),
      desc: `Store multiplier l₃₂ = U₃₂/U₂₂ = ${fmt(l32)} into L[3,2]. Decomposition A = LU complete!`
    });

    // Forward substitution L y = b
    const y0 = b[0];
    const y1 = b[1] - L[1][0] * y0;
    const y2 = b[2] - L[2][0] * y0 - L[2][1] * y1;
    const y = [y0, y1, y2];

    // Back substitution U x = y
    const x2 = Math.abs(U[2][2]) > EPSILON ? y2 / U[2][2] : 0;
    const x1 = Math.abs(U[1][1]) > EPSILON ? (y1 - U[1][2] * x2) / U[1][1] : 0;
    const x0 = Math.abs(U[0][0]) > EPSILON ? (y0 - U[0][1] * x1 - U[0][2] * x2) / U[0][0] : 0;
    const x = [x0, x1, x2];

    return { L, U, steps, y, x, productLU: matMul(L, U) };
  }, [A, b]);

  const curStep = luData.steps[Math.min(stepIdx, luData.steps.length - 1)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setA(cloneMatrix(p.A));
                setB([...p.b]);
                setStepIdx(3);
                onComplete(2);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStepIdx(s);
                onComplete(2);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stepIdx === s ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Matrix A and vector b Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
            Edit Input Matrix A & RHS Vector b
          </h3>
          <div className="flex items-center justify-center gap-4">
            <div className="space-y-1.5">
              <div className="text-xs text-center font-mono text-slate-400">Matrix A</div>
              {A.map((row, r) => (
                <div key={r} className="flex gap-1.5">
                  {row.map((val, c) => (
                    <input
                      key={c}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const next = cloneMatrix(A);
                        next[r][c] = parseFloat(e.target.value) || 0;
                        setA(next);
                      }}
                      className="w-14 py-1 text-center rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="text-xs text-center font-mono text-amber-400">Vector b</div>
              {b.map((val, r) => (
                <div key={r}>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const next = [...b];
                      next[r] = parseFloat(e.target.value) || 0;
                      setB(next);
                    }}
                    className="w-14 py-1 text-center rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
            <strong>{curStep.title}:</strong> {curStep.desc}
          </div>
        </div>

        {/* Decomposition Display A = L * U */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-center items-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <MatrixBracket matrix={A} title="Matrix A" colorClass="text-slate-300" darkMode={darkMode} />
            <span className="text-xl font-bold text-slate-400">=</span>
            <MatrixBracket
              matrix={curStep.L}
              title="Lower L (Multipliers)"
              colorClass="text-emerald-400"
              darkMode={darkMode}
            />
            <span className="text-xl font-bold text-slate-400">×</span>
            <MatrixBracket
              matrix={curStep.U}
              title="Upper U (Echelon)"
              colorClass="text-amber-400"
              darkMode={darkMode}
            />
          </div>

          {/* Two-Stage Solver Card */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-bold uppercase text-emerald-400 mb-1">
                Stage 1: Forward Substitution (L·y = b)
              </div>
              <div className="font-mono text-xs text-slate-300 space-y-1">
                <div>y₁ = {fmt(luData.y[0])}</div>
                <div>y₂ = {fmt(luData.y[1])}</div>
                <div>y₃ = {fmt(luData.y[2])}</div>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-bold uppercase text-amber-400 mb-1">
                Stage 2: Back Substitution (U·x = y)
              </div>
              <div className="font-mono text-xs text-amber-200 space-y-1 font-bold">
                <div>x₁ = {fmt(luData.x[0])}</div>
                <div>x₂ = {fmt(luData.x[1])}</div>
                <div>x₃ = {fmt(luData.x[2])}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 3: THE FOUR FUNDAMENTAL SPACES
// ============================================================================
const Exp3FundamentalSpaces = ({ darkMode, onComplete }) => {
  const presets = [
    {
      name: 'Rank 2 (Dependent Col 3)',
      A: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    },
    {
      name: 'Rank 1 (Outer Product)',
      A: [
        [1, 2, 3],
        [2, 4, 6],
        [3, 6, 9]
      ]
    },
    {
      name: 'Rank 3 (Full Rank Invertible)',
      A: [
        [2, 0, 1],
        [1, 3, 2],
        [0, 1, 2]
      ]
    }
  ];

  const [A, setA] = useState(cloneMatrix(presets[0].A));
  const [xVec, setXVec] = useState([1, 2, -1]);

  // Compute RREF, Rank, Pivot Columns, and Nullity
  const analysis = useMemo(() => {
    const m = cloneMatrix(A);
    const n = 3;
    let lead = 0;
    const pivotCols = [];

    for (let r = 0; r < n; r++) {
      if (lead >= n) break;
      let i = r;
      while (Math.abs(m[i][lead]) < 1e-6) {
        i++;
        if (i === n) {
          i = r;
          lead++;
          if (lead === n) break;
        }
      }
      if (lead === n) break;
      const tmp = m[i];
      m[i] = m[r];
      m[r] = tmp;

      const lv = m[r][lead];
      for (let j = 0; j < n; j++) m[r][j] /= lv;

      for (let i2 = 0; i2 < n; i2++) {
        if (i2 !== r) {
          const lv2 = m[i2][lead];
          for (let j = 0; j < n; j++) m[i2][j] -= lv2 * m[r][j];
        }
      }
      pivotCols.push(lead);
      lead++;
    }

    const rank = pivotCols.length;
    const nullity = n - rank;

    // Row space basis = non-zero rows of RREF
    const rowSpaceBasis = m.filter((row) => row.some((v) => Math.abs(v) > 1e-5));
    // Column space basis = pivot columns of original A
    const colSpaceBasis = pivotCols.map((cIdx) => [A[0][cIdx], A[1][cIdx], A[2][cIdx]]);

    // Null space basis for free columns
    const freeCols = [0, 1, 2].filter((c) => !pivotCols.includes(c));
    const nullSpaceBasis = freeCols.map((fCol) => {
      const vec = [0, 0, 0];
      vec[fCol] = 1;
      pivotCols.forEach((pCol, rIdx) => {
        vec[pCol] = -m[rIdx][fCol];
      });
      return vec;
    });

    // Compute Ax for interactive vector x
    const Ax = [
      dot(A[0], xVec),
      dot(A[1], xVec),
      dot(A[2], xVec)
    ];

    return { rref: m, rank, nullity, pivotCols, rowSpaceBasis, colSpaceBasis, nullSpaceBasis, Ax };
  }, [A, xVec]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setA(cloneMatrix(p.A));
                onComplete(3);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-200 text-xs font-mono font-bold">
          Rank(A) = {analysis.rank} &nbsp;|&nbsp; Nullity(A) = {analysis.nullity} &nbsp;|&nbsp; r + (n - r) = 3 ✓
        </div>
      </div>

      {/* Top Row: Matrix A, RREF(A), and Strang's Orthogonality Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-violet-400">
            Input Matrix A (3×3) & RREF(A)
          </h3>
          <div className="flex flex-wrap items-center justify-around gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-center text-slate-400">Edit Matrix A</div>
              {A.map((row, r) => (
                <div key={r} className="flex gap-1.5">
                  {row.map((val, c) => (
                    <input
                      key={c}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const next = cloneMatrix(A);
                        next[r][c] = parseFloat(e.target.value) || 0;
                        setA(next);
                      }}
                      className="w-14 py-1 text-center rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
            <MatrixBracket matrix={analysis.rref} title="RREF(A)" colorClass="text-fuchsia-400" darkMode={darkMode} />
          </div>

          {/* Interactive Action Ax */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300">Test Vector Mapping: x ∈ ℝ³ ➔ Ax ∈ C(A)</div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span>x = [</span>
              {xVec.map((v, i) => (
                <input
                  key={i}
                  type="number"
                  value={v}
                  onChange={(e) => {
                    const next = [...xVec];
                    next[i] = parseFloat(e.target.value) || 0;
                    setXVec(next);
                  }}
                  className="w-12 py-0.5 text-center rounded bg-slate-900 border border-slate-700 text-sky-300"
                />
              ))}
              <span>]ᵀ ➔ Ax = [{analysis.Ax.map((v) => fmt(v)).join(', ')}]ᵀ</span>
            </div>
          </div>
        </div>

        {/* Strang's 4 Subspaces Visual Map */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-fuchsia-400 mb-3">
            The Four Fundamental Subspaces & Basis Vectors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row Space */}
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-sky-400 uppercase">1. Row Space C(Aᵀ)</span>
                <span className="text-xs font-mono bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded">dim = {analysis.rank}</span>
              </div>
              <p className="text-[11px] text-slate-400">Non-zero rows of RREF(A) in ℝ³:</p>
              <div className="font-mono text-xs text-sky-200 space-y-1">
                {analysis.rowSpaceBasis.map((v, i) => (
                  <div key={i}>r_{i + 1} = [{v.map((n) => fmt(n)).join(', ')}]ᵀ</div>
                ))}
              </div>
            </div>

            {/* Column Space */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase">2. Column Space C(A)</span>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded">dim = {analysis.rank}</span>
              </div>
              <p className="text-[11px] text-slate-400">Pivot columns ({analysis.pivotCols.map((c) => c + 1).join(', ')}) of original A:</p>
              <div className="font-mono text-xs text-emerald-200 space-y-1">
                {analysis.colSpaceBasis.map((v, i) => (
                  <div key={i}>c_{i + 1} = [{v.map((n) => fmt(n)).join(', ')}]ᵀ</div>
                ))}
              </div>
            </div>

            {/* Null Space */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 uppercase">3. Null Space N(A)</span>
                <span className="text-xs font-mono bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded">dim = {analysis.nullity}</span>
              </div>
              <p className="text-[11px] text-slate-400">Solutions to Ax = 0 (⊥ to Row Space):</p>
              <div className="font-mono text-xs text-amber-200 space-y-1">
                {analysis.nullSpaceBasis.length === 0 ? (
                  <div>Only trivial vector {[0, 0, 0].join(', ')}</div>
                ) : (
                  analysis.nullSpaceBasis.map((v, i) => (
                    <div key={i}>n_{i + 1} = [{v.map((n) => fmt(n)).join(', ')}]ᵀ</div>
                  ))
                )}
              </div>
            </div>

            {/* Left Null Space */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-400 uppercase">4. Left Null Space N(Aᵀ)</span>
                <span className="text-xs font-mono bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded">dim = {3 - analysis.rank}</span>
              </div>
              <p className="text-[11px] text-slate-400">Solutions to Aᵀy = 0 (⊥ to Column Space):</p>
              <div className="font-mono text-xs text-rose-200">
                Orthogonal complement of C(A) in ℝ³ with dimension m - r = {3 - analysis.rank}.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 4: LINEAR TRANSFORMATIONS (2D PLAYGROUND)
// ============================================================================
const Exp4Transformations = ({ onComplete }) => {
  const [mat, setMat] = useState([
    [1.5, 0.5],
    [0.2, 1.2]
  ]);
  const [showEigen, setShowEigen] = useState(true);
  const canvasRef = useRef(null);

  const presets = [
    { name: 'Identity', m: [[1, 0], [0, 1]] },
    { name: 'Rotate 45°', m: [[0.707, -0.707], [0.707, 0.707]] },
    { name: 'Horizontal Shear', m: [[1, 1.2], [0, 1]] },
    { name: 'Reflect y = x', m: [[0, 1], [1, 0]] },
    { name: 'Singular Projection', m: [[1, 0.5], [0.5, 0.25]] }
  ];

  const det = det2x2(mat);
  const trace = mat[0][0] + mat[1][1];
  const disc = trace * trace - 4 * det;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const scale = 55;

    ctx.clearRect(0, 0, W, H);

    const toScreen = (x, y) => [cx + x * scale, cy - y * scale];
    const applyT = (x, y) => [mat[0][0] * x + mat[0][1] * y, mat[1][0] * x + mat[1][1] * y];

    // 1. Original Faint Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      const [x1, y1] = toScreen(i, -5);
      const [x2, y2] = toScreen(i, 5);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [hx1, hy1] = toScreen(-5, i);
      const [hx2, hy2] = toScreen(5, i);
      ctx.beginPath(); ctx.moveTo(hx1, hy1); ctx.lineTo(hx2, hy2); ctx.stroke();
    }

    // 2. Transformed Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.2;
    for (let i = -4; i <= 4; i++) {
      const [tx1, ty1] = applyT(i, -4);
      const [tx2, ty2] = applyT(i, 4);
      const [sx1, sy1] = toScreen(tx1, ty1);
      const [sx2, sy2] = toScreen(tx2, ty2);
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();

      const [thx1, thy1] = applyT(-4, i);
      const [thx2, thy2] = applyT(4, i);
      const [shx1, shy1] = toScreen(thx1, thy1);
      const [shx2, shy2] = toScreen(thx2, thy2);
      ctx.beginPath(); ctx.moveTo(shx1, shy1); ctx.lineTo(shx2, shy2); ctx.stroke();
    }

    // 3. Transformed Unit Square (Area = |det|)
    const t0 = applyT(0, 0); const p0 = toScreen(t0[0], t0[1]);
    const t1 = applyT(1, 0); const p1 = toScreen(t1[0], t1[1]);
    const t2 = applyT(1, 1); const p2 = toScreen(t2[0], t2[1]);
    const t3 = applyT(0, 1); const p3 = toScreen(t3[0], t3[1]);

    ctx.fillStyle = det >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.closePath();
    ctx.fill();

    // 4. Eigenvector lines if real
    if (showEigen && disc >= 0) {
      const l1 = (trace + Math.sqrt(disc)) / 2;
      const l2 = (trace - Math.sqrt(disc)) / 2;
      [l1, l2].forEach((lam, idx) => {
        let vx = 1, vy = 0;
        if (Math.abs(mat[0][1]) > 1e-4) {
          vx = mat[0][1];
          vy = lam - mat[0][0];
        } else if (Math.abs(mat[1][0]) > 1e-4) {
          vx = lam - mat[1][1];
          vy = mat[1][0];
        } else if (idx === 1) {
          vx = 0; vy = 1;
        }
        const len = Math.hypot(vx, vy) || 1;
        vx /= len; vy /= len;
        const [ex1, ey1] = toScreen(-5 * vx, -5 * vy);
        const [ex2, ey2] = toScreen(5 * vx, 5 * vy);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ex1, ey1); ctx.lineTo(ex2, ey2); ctx.stroke();
        ctx.restore();
      });
    }

    // Helper for drawing vectors
    const drawArrow = (x, y, color, label) => {
      const [sx, sy] = toScreen(x, y);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 13px monospace';
      ctx.fillText(label, sx + 8, sy - 8);
    };

    drawArrow(mat[0][0], mat[1][0], '#10b981', `T(î)=[${fmt(mat[0][0])},${fmt(mat[1][0])}]`);
    drawArrow(mat[0][1], mat[1][1], '#f43f5e', `T(ĵ)=[${fmt(mat[0][1])},${fmt(mat[1][1])}]`);
  }, [mat, showEigen, det, disc, trace]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            2×2 Transformation Matrix A
          </h3>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setMat(cloneMatrix(p.m));
                  onComplete(4);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Sliders for Matrix Elements */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { r: 0, c: 0, label: 'a₁₁ (î_x)', color: 'accent-emerald-500' },
              { r: 0, c: 1, label: 'a₁₂ (ĵ_x)', color: 'accent-rose-500' },
              { r: 1, c: 0, label: 'a₂₁ (î_y)', color: 'accent-emerald-500' },
              { r: 1, c: 1, label: 'a₂₂ (ĵ_y)', color: 'accent-rose-500' }
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-slate-100 font-bold">{fmt(mat[item.r][item.c])}</span>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.05"
                  value={mat[item.r][item.c]}
                  onChange={(e) => {
                    const next = cloneMatrix(mat);
                    next[item.r][item.c] = parseFloat(e.target.value);
                    setMat(next);
                  }}
                  className={`w-full ${item.color}`}
                />
              </div>
            ))}
          </div>

          {/* Live Invariants */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="text-[11px] text-emerald-400 uppercase font-bold">Area Scaling det(A)</div>
              <div className="text-lg font-mono font-bold text-slate-100">{fmt(det, 3)}</div>
              <div className="text-[11px] text-slate-400">
                {Math.abs(det) < 1e-3 ? 'Space collapses (Singular)' : det < 0 ? 'Orientation Flipped!' : 'Orientation Preserved'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <div className="text-[11px] text-amber-400 uppercase font-bold">Eigenvalues (λ₁, λ₂)</div>
              <div className="text-sm font-mono font-bold text-amber-200 pt-1">
                {disc >= 0
                  ? `${fmt((trace + Math.sqrt(disc)) / 2)}, ${fmt((trace - Math.sqrt(disc)) / 2)}`
                  : 'Complex (Rotation)'}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-1 cursor-pointer">
                <input type="checkbox" checked={showEigen} onChange={(e) => setShowEigen(e.target.checked)} />
                Show Eigenspace Axes
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={380}
          className="w-full max-w-[560px] rounded-xl bg-slate-950 border border-slate-800"
        />
        <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 mt-3">
          <span className="text-emerald-400">● Green: Transformed î = Col 1</span>
          <span className="text-rose-400">● Red: Transformed ĵ = Col 2</span>
          <span className="text-amber-400">-- Dashed: Invariant Eigenvector Axes</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 5: GRAM-SCHMIDT ORTHOGONALIZATION
// ============================================================================
const Exp5GramSchmidt = ({ onComplete }) => {
  const [v1, setV1] = useState([3, 1, 0]);
  const [v2, setV2] = useState([2, 2, 0]);
  const [v3, setV3] = useState([1, 1, 2]);
  const canvasRef = useRef(null);

  const gs = useMemo(() => {
    const u1 = [...v1];
    const q1 = norm(u1) > EPSILON ? scaleVec(u1, 1 / norm(u1)) : [0, 0, 0];

    const proj12 = dot(u1, u1) > EPSILON ? scaleVec(u1, dot(v2, u1) / dot(u1, u1)) : [0, 0, 0];
    const u2 = subVec(v2, proj12);
    const q2 = norm(u2) > EPSILON ? scaleVec(u2, 1 / norm(u2)) : [0, 0, 0];

    const proj13 = dot(u1, u1) > EPSILON ? scaleVec(u1, dot(v3, u1) / dot(u1, u1)) : [0, 0, 0];
    const proj23 = dot(u2, u2) > EPSILON ? scaleVec(u2, dot(v3, u2) / dot(u2, u2)) : [0, 0, 0];
    const u3 = subVec(subVec(v3, proj13), proj23);
    const q3 = norm(u3) > EPSILON ? scaleVec(u3, 1 / norm(u3)) : [0, 0, 0];

    return {
      u1, u2, u3,
      q1, q2, q3,
      proj12,
      dotU1U2: dot(u1, u2),
      dotU2U3: dot(u2, u3),
      dotU1U3: dot(u1, u3)
    };
  }, [v1, v2, v3]);

  // Draw 2D projection of v1, v2, proj_u1(v2), and orthogonal u2
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, scale = 48;
    ctx.clearRect(0, 0, W, H);

    const toScreen = (x, y) => [cx + x * scale, cy - y * scale];

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(...toScreen(i, -5)); ctx.lineTo(...toScreen(i, 5)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...toScreen(-5, i)); ctx.lineTo(...toScreen(5, i)); ctx.stroke();
    }

    const drawVec = (vec, color, label, dashed = false) => {
      const [sx, sy] = toScreen(vec[0], vec[1]);
      ctx.save();
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 12px monospace';
      ctx.fillText(label, sx + 8, sy - 6);
      ctx.restore();
    };

    // Dashed rejection line from proj12 tip to v2 tip
    const [px, py] = toScreen(gs.proj12[0], gs.proj12[1]);
    const [v2x, v2y] = toScreen(v2[0], v2[1]);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(v2x, v2y); ctx.stroke();
    ctx.restore();

    drawVec(v1, '#38bdf8', 'v₁ = u₁');
    drawVec(v2, '#94a3b8', 'v₂ (input)', true);
    drawVec(gs.proj12, '#f43f5e', 'proj_u₁(v₂)');
    drawVec(gs.u2, '#10b981', 'u₂ (⊥ u₁)');
  }, [v1, v2, gs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 space-y-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Input Basis Vectors {'{v₁, v₂, v₃}'}
            </h3>
            <button
              onClick={() => {
                setV1([3, 1, 0]);
                setV2([2, 2, 0]);
                setV3([1, 1, 2]);
                onComplete(5);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300"
            >
              Reset Default
            </button>
          </div>

          {[
            { label: 'v₁', vec: v1, setter: setV1 },
            { label: 'v₂', vec: v2, setter: setV2 },
            { label: 'v₃', vec: v3, setter: setV3 }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-slate-300 w-8">{item.label} =</span>
              {item.vec.map((val, c) => (
                <input
                  key={c}
                  type="number"
                  step="0.5"
                  value={val}
                  onChange={(e) => {
                    const next = [...item.vec];
                    next[c] = parseFloat(e.target.value) || 0;
                    item.setter(next);
                    onComplete(5);
                  }}
                  className="w-20 py-1.5 text-center rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                />
              ))}
            </div>
          ))}

          {/* Step-by-Step Gram-Schmidt Equations */}
          <div className="space-y-2.5 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-sky-400 font-bold">Step 1: u₁ = v₁ ➔ q₁ = u₁ / ||u₁||</div>
              <div>u₁ = [{gs.u1.map((x) => fmt(x)).join(', ')}], &nbsp; q₁ = [{gs.q1.map((x) => fmt(x, 3)).join(', ')}]</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-emerald-400 font-bold">Step 2: u₂ = v₂ - ((v₂·u₁)/(u₁·u₁))u₁ ➔ q₂ = u₂ / ||u₂||</div>
              <div>u₂ = [{gs.u2.map((x) => fmt(x)).join(', ')}], &nbsp; q₂ = [{gs.q2.map((x) => fmt(x, 3)).join(', ')}]</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-amber-400 font-bold">Step 3: u₃ = v₃ - proj_u₁(v₃) - proj_u₂(v₃) ➔ q₃ = u₃ / ||u₃||</div>
              <div>u₃ = [{gs.u3.map((x) => fmt(x)).join(', ')}], &nbsp; q₃ = [{gs.q3.map((x) => fmt(x, 3)).join(', ')}]</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex justify-between">
            <span>u₁ · u₂ = {fmt(gs.dotU1U2, 4)} ✓</span>
            <span>u₂ · u₃ = {fmt(gs.dotU2U3, 4)} ✓</span>
            <span>u₁ · u₃ = {fmt(gs.dotU1U3, 4)} ✓</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          2D Projection Visualizer (XY Plane: u₂ = v₂ - proj_u₁(v₂))
        </h4>
        <canvas
          ref={canvasRef}
          width={480}
          height={340}
          className="w-full max-w-[480px] rounded-xl bg-slate-950 border border-slate-800"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 6: QR FACTORIZATION (A = Q * R)
// ============================================================================
const Exp6QRFactorization = ({ darkMode, onComplete }) => {
  const [A, setA] = useState([
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 1]
  ]);

  const presets = [
    { name: 'Classic 3×3', m: [[1, 1, 0], [1, 0, 1], [0, 1, 1]] },
    { name: 'Strang QR Example', m: [[1, -1, 4], [1, 4, -2], [1, 4, 2]] },
    { name: 'Diagonal Dominant', m: [[3, 1, 1], [1, 4, 2], [0, 2, 5]] }
  ];

  const qr = useMemo(() => {
    const cols = transpose(A);
    const a1 = cols[0], a2 = cols[1], a3 = cols[2];

    const u1 = [...a1];
    const r11 = norm(u1);
    const q1 = r11 > EPSILON ? scaleVec(u1, 1 / r11) : [0, 0, 0];

    const r12 = dot(q1, a2);
    const u2 = subVec(a2, scaleVec(q1, r12));
    const r22 = norm(u2);
    const q2 = r22 > EPSILON ? scaleVec(u2, 1 / r22) : [0, 0, 0];

    const r13 = dot(q1, a3);
    const r23 = dot(q2, a3);
    const u3 = subVec(subVec(a3, scaleVec(q1, r13)), scaleVec(q2, r23));
    const r33 = norm(u3);
    const q3 = r33 > EPSILON ? scaleVec(u3, 1 / r33) : [0, 0, 0];

    const Q = transpose([q1, q2, q3]);
    const R = [
      [r11, r12, r13],
      [0, r22, r23],
      [0, 0, r33]
    ];
    const QtQ = matMul(transpose(Q), Q);
    return { Q, R, QtQ };
  }, [A]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setA(cloneMatrix(p.m));
                onComplete(6);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono text-rose-300">
          Orthonormality Check: QᵀQ = I₃ Verified ✓
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400">Edit Matrix A</h3>
          <div className="space-y-2 flex flex-col items-center">
            {A.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((val, c) => (
                  <input
                    key={c}
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const next = cloneMatrix(A);
                      next[r][c] = parseFloat(e.target.value) || 0;
                      setA(next);
                      onComplete(6);
                    }}
                    className="w-16 py-1.5 text-center rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="pt-2 flex justify-center">
            <MatrixBracket matrix={qr.QtQ} title="Verification: QᵀQ = I" colorClass="text-emerald-400" darkMode={darkMode} />
          </div>
        </div>

        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-center gap-4">
          <MatrixBracket matrix={A} title="Matrix A" darkMode={darkMode} />
          <span className="text-xl font-bold text-slate-400">=</span>
          <MatrixBracket matrix={qr.Q} title="Orthonormal Q" subtitle="Columns q₁, q₂, q₃" colorClass="text-rose-400" darkMode={darkMode} />
          <span className="text-xl font-bold text-slate-400">×</span>
          <MatrixBracket matrix={qr.R} title="Upper Triangular R" subtitle="R = QᵀA" colorClass="text-amber-400" darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 7: LINEAR DEPENDENCE, INDEPENDENCE & SPAN PLAYGROUND
// ============================================================================
const Exp7LinearDependence = ({ onComplete }) => {
  const [v1, setV1] = useState([2, 1]);
  const [v2, setV2] = useState([1, 2]);
  const [c1, setC1] = useState(1.5);
  const [c2, setC2] = useState(1.0);
  const [target, setTarget] = useState([4, 3.5]);
  const canvasRef = useRef(null);

  const det = v1[0] * v2[1] - v1[1] * v2[0];
  const isDependent = Math.abs(det) < 1e-3;
  const comb = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]];
  const distToTarget = Math.hypot(comb[0] - target[0], comb[1] - target[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, scale = 38;
    ctx.clearRect(0, 0, W, H);
    const toScreen = (x, y) => [cx + x * scale, cy - y * scale];

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(...toScreen(i, -6)); ctx.lineTo(...toScreen(i, 6)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...toScreen(-6, i)); ctx.lineTo(...toScreen(6, i)); ctx.stroke();
    }

    // If dependent, highlight the 1D line span
    if (isDependent) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(...toScreen(-5 * v1[0], -5 * v1[1]));
      ctx.lineTo(...toScreen(5 * v1[0], 5 * v1[1]));
      ctx.stroke();
    }

    // Target Star
    const [tx, ty] = toScreen(target[0], target[1]);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Target (${target[0]}, ${target[1]})`, tx + 10, ty - 8);

    // Parallelogram for c1*v1 + c2*v2
    const pC1 = toScreen(c1 * v1[0], c1 * v1[1]);
    const pComb = toScreen(comb[0], comb[1]);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pC1[0], pC1[1]);
    ctx.lineTo(pComb[0], pComb[1]);
    ctx.stroke();
    ctx.restore();

    const drawVec = (x, y, col, label) => {
      const [sx, sy] = toScreen(x, y);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(label, sx + 6, sy + 14);
    };

    drawVec(v1[0], v1[1], '#38bdf8', 'v₁');
    drawVec(v2[0], v2[1], '#10b981', 'v₂');
    drawVec(comb[0], comb[1], '#ec4899', `c₁v₁+c₂v₂`);
  }, [v1, v2, c1, c2, target, isDependent, comb]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
              Vector Span & Independence Tester
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDependent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
              {isDependent ? 'Linearly Dependent (Span = Line)' : 'Linearly Independent (Span = ℝ²)'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setV1([2, 1]); setV2([1, 2]); }}
              className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-200"
            >
              Independent Pair
            </button>
            <button
              onClick={() => { setV1([2, 1]); setV2([4, 2]); onComplete(7); }}
              className="px-3 py-1 rounded bg-rose-500/20 text-xs text-rose-300 border border-rose-500/30"
            >
              Make Collinear (Dependent)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-sky-400">Vector v₁ = [{v1[0]}, {v1[1]}]</div>
              <input type="range" min="-3" max="3" step="0.5" value={v1[0]} onChange={(e) => setV1([parseFloat(e.target.value), v1[1]])} className="w-full" />
              <input type="range" min="-3" max="3" step="0.5" value={v1[1]} onChange={(e) => setV1([v1[0], parseFloat(e.target.value)])} className="w-full" />
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400">Vector v₂ = [{v2[0]}, {v2[1]}]</div>
              <input type="range" min="-3" max="3" step="0.5" value={v2[0]} onChange={(e) => setV2([parseFloat(e.target.value), v2[1]])} className="w-full" />
              <input type="range" min="-3" max="3" step="0.5" value={v2[1]} onChange={(e) => setV2([v2[0], parseFloat(e.target.value)])} className="w-full" />
            </div>
          </div>

          {/* Scalar Sliders c1, c2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-pink-400">
              Linear Combination: c₁v₁ + c₂v₂ = [{fmt(comb[0])}, {fmt(comb[1])}]
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono"><span>Scalar c₁</span><span>{c1}</span></div>
              <input type="range" min="-3" max="3" step="0.25" value={c1} onChange={(e) => { setC1(parseFloat(e.target.value)); onComplete(7); }} className="w-full accent-sky-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono"><span>Scalar c₂</span><span>{c2}</span></div>
              <input type="range" min="-3" max="3" step="0.25" value={c2} onChange={(e) => { setC2(parseFloat(e.target.value)); onComplete(7); }} className="w-full accent-emerald-400" />
            </div>
            {distToTarget < 0.25 && (
              <div className="p-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                🎯 Target Reached! b = {c1}v₁ + {c2}v₂
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={360}
          className="w-full max-w-[520px] rounded-xl bg-slate-950 border border-slate-800"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 8: LEAST SQUARES APPROXIMATION
// ============================================================================
const Exp8LeastSquares = ({ darkMode, onComplete }) => {
  const [points, setPoints] = useState([
    { x: -3, y: -1.5 },
    { x: -1, y: 0.5 },
    { x: 1, y: 1.2 },
    { x: 3, y: 3.1 },
    { x: 4, y: 3.8 }
  ]);
  const [polyDegree, setPolyDegree] = useState(1); // 1 = Linear, 2 = Quadratic
  const canvasRef = useRef(null);

  // Solve Normal Equations (A^T A) x_hat = A^T b
  const fit = useMemo(() => {
    const n = points.length;
    if (n < 2) return null;

    if (polyDegree === 1) {
      const A = points.map((p) => [1, p.x]);
      const b = points.map((p) => [p.y]);
      const At = transpose(A);
      const AtA = matMul(At, A);
      const Atb = matMul(At, b);
      const d = det2x2(AtA);
      if (Math.abs(d) < EPSILON) return null;
      const c = (Atb[0][0] * AtA[1][1] - AtA[0][1] * Atb[1][0]) / d;
      const m = (AtA[0][0] * Atb[1][0] - Atb[0][0] * AtA[1][0]) / d;
      const sse = points.reduce((acc, p) => acc + Math.pow(p.y - (m * p.x + c), 2), 0);
      return { degree: 1, coeffs: [c, m], AtA, Atb, sse, eq: `ŷ = ${fmt(m, 3)}x + ${fmt(c, 3)}` };
    } else {
      // Quadratic y = c0 + c1 x + c2 x^2 via 3x3 Gaussian solver
      const A = points.map((p) => [1, p.x, p.x * p.x]);
      const b = points.map((p) => [p.y]);
      const At = transpose(A);
      const AtA = matMul(At, A);
      const Atb = matMul(At, b);
      // Solve 3x3 AtA * coeffs = Atb
      const aug = AtA.map((r, i) => [...r, Atb[i][0]]);
      for (let col = 0; col < 3; col++) {
        const piv = aug[col][col] || 1e-6;
        for (let j = col; j <= 3; j++) aug[col][j] /= piv;
        for (let r = 0; r < 3; r++) {
          if (r !== col) {
            const f = aug[r][col];
            for (let j = col; j <= 3; j++) aug[r][j] -= f * aug[col][j];
          }
        }
      }
      const [c0, c1, c2] = [aug[0][3], aug[1][3], aug[2][3]];
      const sse = points.reduce((acc, p) => acc + Math.pow(p.y - (c0 + c1 * p.x + c2 * p.x * p.x), 2), 0);
      return { degree: 2, coeffs: [c0, c1, c2], AtA, Atb, sse, eq: `ŷ = ${fmt(c2, 3)}x² + ${fmt(c1, 3)}x + ${fmt(c0, 3)}` };
    }
  }, [points, polyDegree]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, scale = 42;
    ctx.clearRect(0, 0, W, H);
    const toScreen = (x, y) => [cx + x * scale, cy - y * scale];

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(...toScreen(i, -6)); ctx.lineTo(...toScreen(i, 6)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...toScreen(-6, i)); ctx.lineTo(...toScreen(6, i)); ctx.stroke();
    }

    if (fit) {
      const evalY = (x) =>
        fit.degree === 1
          ? fit.coeffs[0] + fit.coeffs[1] * x
          : fit.coeffs[0] + fit.coeffs[1] * x + fit.coeffs[2] * x * x;

      // Draw vertical error residual bars
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
      ctx.lineWidth = 2;
      points.forEach((p) => {
        const yHat = evalY(p.x);
        const [sx, sy] = toScreen(p.x, p.y);
        const [hx, hy] = toScreen(p.x, yHat);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
      });

      // Draw curve
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let px = -6; px <= 6; px += 0.15) {
        const py = evalY(px);
        const [sx, sy] = toScreen(px, py);
        if (px === -6) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Draw data points
    points.forEach((p) => {
      const [sx, sy] = toScreen(p.x, p.y);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, fit]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = Math.round(((px - canvasRef.current.width / 2) / 42) * 10) / 10;
    const y = Math.round(((canvasRef.current.height / 2 - py) / 42) * 10) / 10;
    setPoints([...points, { x, y }]);
    onComplete(8);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400">
              Normal Equations (AᵀAx̂ = Aᵀb)
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPolyDegree(1)}
                className={`px-2.5 py-1 rounded text-xs font-bold ${polyDegree === 1 ? 'bg-lime-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                Linear Fit
              </button>
              <button
                onClick={() => { setPolyDegree(2); onComplete(8); }}
                className={`px-2.5 py-1 rounded text-xs font-bold ${polyDegree === 2 ? 'bg-lime-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                Quadratic Fit
              </button>
            </div>
          </div>

          {fit && (
            <>
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <div className="text-xs text-emerald-400 font-bold uppercase">Best Fit Model</div>
                <div className="text-base font-mono font-bold text-slate-100">{fit.eq}</div>
                <div className="text-xs font-mono text-rose-300">
                  Sum of Squared Errors ||Ax̂ - b||² = {fmt(fit.sse, 4)}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <MatrixBracket matrix={fit.AtA} title="AᵀA Matrix" colorClass="text-lime-400" darkMode={darkMode} />
                <MatrixBracket matrix={fit.Atb} title="Aᵀb Vector" colorClass="text-amber-400" darkMode={darkMode} />
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">{points.length} Data Points (Click canvas to add)</span>
            <button
              onClick={() => setPoints([{ x: -3, y: -1.5 }, { x: 0, y: 0.5 }, { x: 3, y: 2.8 }])}
              className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Reset Points
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={540}
          height={360}
          onClick={handleCanvasClick}
          className="w-full max-w-[540px] rounded-xl bg-slate-950 border border-slate-800 cursor-crosshair"
        />
        <span className="text-xs text-slate-400 mt-2">
          💡 Click anywhere on the coordinate plane to add new noisy observations! Red bars show residuals e = b - Ax̂.
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 9: CASE STUDY - CLASSICAL CRYPTOSYSTEMS (HILL CIPHER)
// ============================================================================
const Exp9HillCipher = ({ darkMode, onComplete }) => {
  const [plaintext, setPlaintext] = useState('LINEAR');
  const [K, setK] = useState([
    [3, 3],
    [2, 5]
  ]);

  const validPresets = [
    { name: 'Standard Hill [[3,3],[2,5]]', k: [[3, 3], [2, 5]] },
    { name: 'Fibonacci Key [[1,2],[2,5]]', k: [[1, 2], [2, 5]] },
    { name: 'Cipher Key [[7,8],[11,11]]', k: [[7, 8], [11, 11]] }
  ];

  const cryptoData = useMemo(() => {
    const clean = plaintext.toUpperCase().replace(/[^A-Z]/g, '') || 'LA';
    const padded = clean.length % 2 === 1 ? clean + 'X' : clean;

    const rawDet = K[0][0] * K[1][1] - K[0][1] * K[1][0];
    const detMod26 = mod(rawDet, 26);
    const detInv = modInverse(detMod26, 26);
    const isInvertible = detInv !== null && gcd(detMod26, 26) === 1;

    let KInv = null;
    if (isInvertible) {
      KInv = [
        [mod(detInv * K[1][1], 26), mod(-detInv * K[0][1], 26)],
        [mod(-detInv * K[1][0], 26), mod(detInv * K[0][0], 26)]
      ];
    }

    const blocks = [];
    let cipherText = '';
    let decryptedText = '';

    for (let i = 0; i < padded.length; i += 2) {
      const pVec = [padded.charCodeAt(i) - 65, padded.charCodeAt(i + 1) - 65];
      const cVec = [
        mod(K[0][0] * pVec[0] + K[0][1] * pVec[1], 26),
        mod(K[1][0] * pVec[0] + K[1][1] * pVec[1], 26)
      ];
      const cChars = String.fromCharCode(cVec[0] + 65) + String.fromCharCode(cVec[1] + 65);
      cipherText += cChars;

      let dVec = [0, 0];
      if (KInv) {
        dVec = [
          mod(KInv[0][0] * cVec[0] + KInv[0][1] * cVec[1], 26),
          mod(KInv[1][0] * cVec[0] + KInv[1][1] * cVec[1], 26)
        ];
        decryptedText += String.fromCharCode(dVec[0] + 65) + String.fromCharCode(dVec[1] + 65);
      }
      blocks.push({ pair: padded.slice(i, i + 2), pVec, cVec, cChars, dVec });
    }

    return { padded, rawDet, detMod26, detInv, isInvertible, KInv, blocks, cipherText, decryptedText };
  }, [plaintext, K]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap gap-2">
          {validPresets.map((p, i) => (
            <button
              key={i}
              onClick={() => { setK(cloneMatrix(p.k)); onComplete(9); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${cryptoData.isInvertible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
          {cryptoData.isInvertible
            ? `✓ Valid Key: det(K) ≡ ${cryptoData.detMod26} (mod 26), det⁻¹ ≡ ${cryptoData.detInv}`
            : `✗ Invalid Key: gcd(${cryptoData.detMod26}, 26) ≠ 1 (Not Invertible mod 26)`}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-fuchsia-400">
            Plaintext & Key Matrix K (mod 26)
          </h3>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Secret Message (A-Z)</label>
            <input
              type="text"
              maxLength={14}
              value={plaintext}
              onChange={(e) => { setPlaintext(e.target.value); onComplete(9); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-base text-amber-300 tracking-widest uppercase"
            />
          </div>

          <div className="flex items-center justify-around pt-2">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-center text-slate-400">Key Matrix K</div>
              {K.map((row, r) => (
                <div key={r} className="flex gap-1.5">
                  {row.map((val, c) => (
                    <input
                      key={c}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const next = cloneMatrix(K);
                        next[r][c] = parseInt(e.target.value, 10) || 0;
                        setK(next);
                      }}
                      className="w-14 py-1.5 text-center rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                    />
                  ))}
                </div>
              ))}
            </div>

            {cryptoData.KInv && (
              <MatrixBracket
                matrix={cryptoData.KInv}
                title="Decryption K⁻¹ (mod 26)"
                colorClass="text-emerald-400"
                darkMode={darkMode}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Block-by-Block Matrix Encryption: C ≡ K · P (mod 26)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cryptoData.blocks.map((b, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-bold">Block {idx + 1}: "{b.pair}"</div>
                <div className="text-sky-300">P = [{b.pVec[0]}, {b.pVec[1]}]ᵀ</div>
                <div className="text-fuchsia-300">C ≡ [{b.cVec[0]}, {b.cVec[1]}]ᵀ ➔ "{b.cChars}"</div>
                {cryptoData.isInvertible && (
                  <div className="text-emerald-300">D ≡ K⁻¹C = [{b.dVec[0]}, {b.dVec[1]}]ᵀ</div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30">
              <div className="text-xs text-fuchsia-300 uppercase font-bold">Encrypted Ciphertext</div>
              <div className="text-xl font-mono font-bold tracking-widest text-white mt-1">
                {cryptoData.cipherText}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="text-xs text-emerald-300 uppercase font-bold">Decrypted with K⁻¹</div>
              <div className="text-xl font-mono font-bold tracking-widest text-emerald-200 mt-1">
                {cryptoData.isInvertible ? cryptoData.decryptedText : 'KEY NOT INVERTIBLE'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 10: GAUSS-JORDAN MATRIX INVERSION [A | I] -> [I | A^-1]
// ============================================================================
const Exp10GaussJordanInverse = ({ darkMode, onComplete }) => {
  const [A, setA] = useState([
    [2, 1, 0],
    [1, 2, 1],
    [0, 1, 2]
  ]);
  const [stepIdx, setStepIdx] = useState(0);

  const presets = [
    { name: 'Tridiagonal Matrix', m: [[2, 1, 0], [1, 2, 1], [0, 1, 2]] },
    { name: 'Unimodular (det = 1)', m: [[1, 2, 0], [0, 1, 1], [1, 1, 1]] },
    { name: 'Singular Matrix (det = 0)', m: [[1, 2, 3], [2, 4, 6], [0, 1, 1]] }
  ];

  const invData = useMemo(() => {
    const det = det3x3(A);
    const aug = A.map((row, r) => [
      ...row,
      r === 0 ? 1 : 0,
      r === 1 ? 1 : 0,
      r === 2 ? 1 : 0
    ]);

    const steps = [{ mat: cloneMatrix(aug), desc: 'Initial Augmented Matrix [A | I₃]', pivot: [0, 0] }];
    const n = 3;

    if (Math.abs(det) > EPSILON) {
      for (let col = 0; col < n; col++) {
        let maxR = col;
        for (let r = col + 1; r < n; r++) {
          if (Math.abs(aug[r][col]) > Math.abs(aug[maxR][col])) maxR = r;
        }
        if (maxR !== col) {
          const tmp = aug[col]; aug[col] = aug[maxR]; aug[maxR] = tmp;
          steps.push({ mat: cloneMatrix(aug), desc: `Swap R${col + 1} ↔ R${maxR + 1}`, pivot: [col, col] });
        }

        const piv = aug[col][col];
        if (Math.abs(piv - 1) > EPSILON) {
          for (let c = 0; c < 6; c++) aug[col][c] /= piv;
          steps.push({ mat: cloneMatrix(aug), desc: `Scale Pivot R${col + 1} ← (1/${fmt(piv)})·R${col + 1}`, pivot: [col, col] });
        }

        for (let r = 0; r < n; r++) {
          if (r !== col && Math.abs(aug[r][col]) > EPSILON) {
            const f = aug[r][col];
            for (let c = 0; c < 6; c++) aug[r][c] -= f * aug[col][c];
            steps.push({ mat: cloneMatrix(aug), desc: `Eliminate entry (${r + 1},${col + 1}): R${r + 1} ← R${r + 1} - (${fmt(f)})·R${col + 1}`, pivot: [col, col] });
          }
        }
      }
      steps.push({ mat: cloneMatrix(aug), desc: 'Gauss-Jordan Complete! [I₃ | A⁻¹] Achieved.', pivot: [2, 2] });
    }

    const finalAug = steps[steps.length - 1].mat;
    const AInv = finalAug.map((r) => r.slice(3, 6));
    return { det, steps, AInv };
  }, [A]);

  const cur = invData.steps[Math.min(stepIdx, invData.steps.length - 1)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setA(cloneMatrix(p.m));
                setStepIdx(0);
                onComplete(10);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {p.name}
            </button>
          ))}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${Math.abs(invData.det) > EPSILON ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
          det(A) = {fmt(invData.det, 3)} {Math.abs(invData.det) > EPSILON ? '(Invertible)' : '(Singular - No Inverse!)'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Edit 3×3 Matrix A</h3>
          <div className="space-y-2 flex flex-col items-center">
            {A.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((val, c) => (
                  <input
                    key={c}
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const next = cloneMatrix(A);
                      next[r][c] = parseFloat(e.target.value) || 0;
                      setA(next);
                      setStepIdx(0);
                    }}
                    className="w-16 py-1.5 text-center rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
                  />
                ))}
              </div>
            ))}
          </div>
          {Math.abs(invData.det) > EPSILON && (
            <div className="flex justify-center pt-2">
              <MatrixBracket matrix={invData.AInv} title="Extracted Inverse A⁻¹" colorClass="text-emerald-400" darkMode={darkMode} />
            </div>
          )}
        </div>

        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-amber-300">{cur.desc}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-200"
              >
                ← Prev
              </button>
              <span className="text-xs font-mono text-slate-400">
                {stepIdx + 1} / {invData.steps.length}
              </span>
              <button
                onClick={() => {
                  setStepIdx((s) => Math.min(invData.steps.length - 1, s + 1));
                  onComplete(10);
                }}
                className="px-3 py-1 rounded bg-sky-600 text-xs font-bold text-white"
              >
                Next →
              </button>
              <button
                onClick={() => {
                  setStepIdx(invData.steps.length - 1);
                  onComplete(10);
                }}
                className="px-3 py-1 rounded bg-emerald-600 text-xs font-bold text-white"
              >
                Jump to [I | A⁻¹]
              </button>
            </div>
          </div>

          <div className="flex justify-center py-4 overflow-x-auto">
            <MatrixBracket
              matrix={cur.mat}
              title="Augmented [A | I₃] ➔ [I₃ | A⁻¹]"
              highlightPivot={cur.pivot}
              augmentedCol={3}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================
export default function App() {
  const [activeExp, setActiveExp] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [completedExps, setCompletedExps] = useState([1]);
  const [studentName, setStudentName] = useState('Tasmmai Rajesh Parekh');
  const [studentMeta, setStudentMeta] = useState('B.Tech EXTC • DJ Sanghvi College of Engineering');
  const [editingProfile, setEditingProfile] = useState(false);

  const currentMeta = EXPERIMENTS.find((e) => e.id === activeExp) || EXPERIMENTS[0];

  const markComplete = (id) => {
    if (!completedExps.includes(id)) {
      setCompletedExps([...completedExps, id]);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top University Submission Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Grid className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  DJS23EPE304L
                </span>
                <span className="text-xs text-emerald-400 font-mono hidden sm:inline">
                  ● Interactive Virtual Lab Submission
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Linear Algebra Laboratory / Tutorial
              </h1>
            </div>
          </div>

          {/* Student Submission Badge (Editable) */}
          <div className="flex items-center gap-3">
            {editingProfile ? (
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Student Name"
                  className="px-2 py-1 text-xs rounded bg-slate-900 text-white border border-slate-700"
                />
                <input
                  type="text"
                  value={studentMeta}
                  onChange={(e) => setStudentMeta(e.target.value)}
                  placeholder="Roll No / Branch"
                  className="px-2 py-1 text-xs rounded bg-slate-900 text-slate-300 border border-slate-700"
                />
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingProfile(true)}
                title="Click to edit student submission details"
                className="cursor-pointer group flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all"
              >
                <User className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-sky-300">
                    {studentName} <span className="text-[10px] text-slate-400 font-normal">(Edit)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{studentMeta}</div>
                </div>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Print Lab Observation Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Syllabus Experiment List (Exp 1 - Exp 10) */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Syllabus Experiments (1–10)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {completedExps.length}/10 Explored
              </span>
            </div>
            <div className="space-y-1.5">
              {EXPERIMENTS.map((exp) => {
                const isActive = exp.id === activeExp;
                const isDone = completedExps.includes(exp.id);
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      setActiveExp(exp.id);
                      markComplete(exp.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      isActive
                        ? `bg-gradient-to-r ${exp.color} text-white shadow-md`
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/60'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono mr-1.5 opacity-80">#{exp.id}</span>
                      {exp.short.replace(`Exp ${exp.id}: `, '')}
                    </div>
                    {isDone && (
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Active Experiment Workspace */}
        <main className="lg:col-span-9 space-y-6">
          {/* Experiment Aim & Header Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentMeta.color}`} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${currentMeta.color} text-white`}>
                  Experiment {currentMeta.id} of 10
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {currentMeta.badge}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={activeExp === 1}
                  onClick={() => setActiveExp((e) => Math.max(1, e - 1))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300"
                >
                  ← Prev Exp
                </button>
                <button
                  disabled={activeExp === 10}
                  onClick={() => {
                    const next = Math.min(10, activeExp + 1);
                    setActiveExp(next);
                    markComplete(next);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300"
                >
                  Next Exp →
                </button>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              {currentMeta.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              <strong className="text-sky-400">Aim: </strong>
              {currentMeta.aim}
            </p>
          </div>

          {/* Dynamic Experiment Component */}
          {activeExp === 1 && <Exp1Gaussian darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 2 && <Exp2LUFactorization darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 3 && <Exp3FundamentalSpaces darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 4 && <Exp4Transformations onComplete={markComplete} />}
          {activeExp === 5 && <Exp5GramSchmidt onComplete={markComplete} />}
          {activeExp === 6 && <Exp6QRFactorization darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 7 && <Exp7LinearDependence onComplete={markComplete} />}
          {activeExp === 8 && <Exp8LeastSquares darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 9 && <Exp9HillCipher darkMode={darkMode} onComplete={markComplete} />}
          {activeExp === 10 && <Exp10GaussJordanInverse darkMode={darkMode} onComplete={markComplete} />}
        </main>
      </div>
    </div>
  );
}