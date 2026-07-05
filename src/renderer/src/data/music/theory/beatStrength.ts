// 拍節構造（メトリック・ヒエラルキー）の理論データ
// 4/4拍子における各拍の機能的な強さを定義する

export type BeatStrength = 'strong' | 'medium' | 'weak_backbeat'

// 拍インデックス（0〜3）→ 強弱ラベル
export const BEAT_STRENGTH: Record<0 | 1 | 2 | 3, BeatStrength> = {
  0: 'strong',        // 1拍目：最強拍（曲の重心）
  1: 'weak_backbeat', // 2拍目：弱拍。スネアを置くとバックビートになる
  2: 'medium',        // 3拍目：準強拍
  3: 'weak_backbeat', // 4拍目：弱拍。スネアを置くとバックビートになる
}

export const BEAT_STRENGTH_NAMES: Record<BeatStrength, string> = {
  strong:        '最強拍',
  medium:        '準強拍',
  weak_backbeat: '弱拍（バックビート）',
}
