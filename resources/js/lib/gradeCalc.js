// Grade calculation helpers. Pure functions, no React, so they are easy to test and reuse on the server later.
//
// Score status:  'scored' | 'pending' | 'absent' | 'exempt'   (a missing record means 'pending')
//   scored   -> counts
//   pending  -> never counted as zero; the grade is flagged as provisional
//   absent   -> counts as zero or is left out, depending on policy.absent ('zero' | 'excluded')
//   exempt   -> left out
//
// Calculation:
//   component % = sum of counted scores / sum of counted max scores * 100
//   initial grade = sum(component % * weight / 100)
//   quarterly grade = conversion rule applied to the initial grade, rounded to a whole number

export const TYPE_KEYS = ['written_work', 'performance_task', 'quarterly_assessment'];

export const schemeTotal = (scheme) =>
    TYPE_KEYS.reduce((n, k) => n + (Number(scheme.components[k]) || 0), 0);

export const schemeIsValid = (scheme) =>
    Math.abs(schemeTotal(scheme) - 100) < 0.001 &&
    TYPE_KEYS.every((k) => Number(scheme.components[k]) >= 0);

/** conversion: { mode: 'none' } or { mode: 'table', rows: [{ from, grade }] } (highest row whose `from` <= initial grade wins) */
export function convertGrade(initial, conversion) {
    if (conversion?.mode === 'table') {
        const rows = (conversion.rows ?? [])
            .filter((r) => r.from !== '' && r.grade !== '')
            .map((r) => ({ from: Number(r.from), grade: Number(r.grade) }))
            .sort((a, b) => b.from - a.from);
        const hit = rows.find((r) => initial >= r.from);
        if (hit) return Math.round(hit.grade);
    }
    return Math.round(initial);
}

/**
 * @returns {{ pcts: Record<string, number|null>, pending: number,
 *             initial: number|null, quarterly: number|null,
 *             state: 'complete'|'provisional'|'incomplete' }}
 */
export function computeStudentGrade({ studentId, assessments, scores, scheme, policy, conversion, allowProvisional = false }) {
    const pcts = {};
    let pending = 0;

    TYPE_KEYS.forEach((type) => {
        let num = 0;
        let den = 0;
        assessments.filter((a) => a.type === type).forEach((a) => {
            const rec = scores[`${a.id}|${studentId}`];
            const status = rec?.status ?? 'pending';
            if (status === 'scored') { num += Number(rec.score); den += a.max; }
            else if (status === 'absent' && policy.absent === 'zero') { den += a.max; }
            else if (status === 'pending') { pending += 1; }
        });
        pcts[type] = den > 0 ? (num / den) * 100 : null;
    });

    const present = TYPE_KEYS.filter((k) => pcts[k] !== null);
    const allComponents = present.length === TYPE_KEYS.length;

    let initial = null;
    let state = 'incomplete';

    if (allComponents) {
        initial = TYPE_KEYS.reduce((n, k) => n + (pcts[k] * (Number(scheme.components[k]) || 0)) / 100, 0);
        state = pending === 0 ? 'complete' : 'provisional';
    } else if (allowProvisional && present.length > 0) {
        const w = present.reduce((n, k) => n + (Number(scheme.components[k]) || 0), 0);
        if (w > 0) {
            initial = present.reduce((n, k) => n + pcts[k] * (Number(scheme.components[k]) || 0), 0) / w;
            state = 'provisional';
        }
    }

    return {
        pcts, pending, initial,
        quarterly: initial === null ? null : convertGrade(initial, conversion),
        state,
    };
}