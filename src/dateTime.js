export function toLocalDate(dt) {
    const pad = (num) => (num < 10 ? `0${num}` : String(num));
    const dateParts = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
    const timeParts = [dt.getHours(), dt.getMinutes(), dt.getSeconds()];
    return `${dateParts.map(pad).join('-')} ${timeParts.map(pad).join(':')}`;
}

export function daysBetween(dt1, dt2) {
    // Clone the dates so we don't modify the originals
    dt1 = new Date(dt1);
    dt2 = new Date(dt2);

    // Set both copies to midnight to ignore the time part
    dt1.setHours(0, 0, 0, 0);
    dt2.setHours(0, 0, 0, 0);

    const diffMs = Math.abs(dt2 - dt1);
    return diffMs / 86400000; // Milliseconds in a day
}

export function toDurationString(secs) {
    const absSecs = Math.abs(Math.round(secs));
    if (Number.isNaN(absSecs)) {
        return '"Invalid seconds"';
    }

    const timeUnits = [
        ['d', Math.floor(absSecs / 86400)],
        ['h', Math.floor(absSecs / 3600) % 24],
        ['m', Math.floor(absSecs / 60) % 60],
        ['s', absSecs % 60],
    ];

    let res = '';
    for (const [unit, value] of timeUnits) {
        if (value > 0) {
            res += `${value}${unit}`;
        }
    }
    if (res === '') {
        return '0s';
    }
    return secs < 0 ? `-${res}` : res;
}

export function toDurationStringMs(ms) {
    const absMs = Math.abs(Math.round(ms));
    if (Number.isNaN(absMs)) {
        return '"Invalid milliseconds"';
    }

    const timeUnits = [
        ['d', Math.floor(absMs / 86400000)],
        ['h', Math.floor(absMs / 3600000) % 24],
        ['m', Math.floor(absMs / 60000) % 60],
        ['s', Math.floor(absMs / 1000) % 60],
        ['ms', absMs % 1000],
    ];

    let res = '';
    for (const [unit, value] of timeUnits) {
        if (value > 0) {
            res += `${value}${unit}`;
        }
    }
    if (res === '') {
        return '0ms';
    }
    return ms < 0 ? `-${res}` : res;
}

export function toHumanTimeString(dt, dtNow = new Date()) {
    dt = new Date(dt);
    if (!dt) {
        return '"Invalid date"';
    }

    const timeUnits = [
        ['year', 'years', 31556926],
        ['month', 'months', 2629744],
        ['day', 'days', 86400],
        ['hour', 'hours', 3600],
        ['minute', 'minutes', 60],
        ['second', 'seconds', 1],
    ];
    const tense = dt < dtNow ? 'ago' : 'from now';

    const diffSecs = Math.abs((dtNow - dt) / 1000);
    for (const [singular, plural, secs] of timeUnits) {
        if (diffSecs >= secs) {
            const value = Math.floor(diffSecs / secs);
            const unit = value === 1 ? singular : plural;
            return `${value} ${unit} ${tense}`;
        }
    }
    return `0 seconds ${tense}`;
}

export function toHumanTimeStringMs(dt, dtNow = new Date()) {
    dt = new Date(dt);
    if (!dt) {
        return '"Invalid date"';
    }

    const timeUnits = [
        ['year', 'years', 31556926000],
        ['month', 'months', 2629744000],
        ['day', 'days', 86400000],
        ['hour', 'hours', 3600000],
        ['minute', 'minutes', 60000],
        ['second', 'seconds', 1000],
        ['millisecond', 'milliseconds', 1],
    ];
    const tense = dt < dtNow ? 'ago' : 'from now';

    const diffMs = Math.abs(dtNow - dt);
    for (const [singular, plural, ms] of timeUnits) {
        if (diffMs >= ms) {
            const value = Math.floor(diffMs / ms);
            const unit = value === 1 ? singular : plural;
            return `${value} ${unit} ${tense}`;
        }
    }
    return `0 milliseconds ${tense}`;
}
