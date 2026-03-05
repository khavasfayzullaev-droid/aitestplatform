// IELTS Band Score Calculator
// Maps raw correct answers (out of 40) to IELTS 9-band scale

const IELTS_BAND_MAP: [number, number][] = [
    [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5],
    [30, 7.0], [27, 6.5], [23, 6.0], [20, 5.5],
    [16, 5.0], [13, 4.5], [10, 4.0], [6, 3.5],
    [4, 3.0], [2, 2.5], [1, 2.0],
]

export function rawToBand(correct: number, total: number): number {
    // Normalize to 40-question scale
    const normalized = Math.round((correct / Math.max(total, 1)) * 40)
    for (const [threshold, band] of IELTS_BAND_MAP) {
        if (normalized >= threshold) return band
    }
    return 1.0
}

export function overallBand(scores: number[]): number {
    const validScores = scores.filter(s => s > 0)
    if (validScores.length === 0) return 0
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length
    // IELTS rounds to nearest 0.5
    return Math.round(avg * 2) / 2
}

export function bandToLabel(band: number): string {
    if (band >= 9.0) return 'Expert'
    if (band >= 8.0) return 'Very Good'
    if (band >= 7.0) return 'Good'
    if (band >= 6.0) return 'Competent'
    if (band >= 5.0) return 'Modest'
    if (band >= 4.0) return 'Limited'
    return 'Extremely Limited'
}

export function bandToColor(band: number): string {
    if (band >= 8.0) return '#10B981'
    if (band >= 7.0) return '#3B82F6'
    if (band >= 6.0) return '#F59E0B'
    if (band >= 5.0) return '#F97316'
    return '#EF4444'
}
