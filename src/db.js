export async function dbQueryRows(conn, query, ...args) {
    return new Promise((resolve, reject) => {
        conn.query(query, args, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export async function dbQueryRow(conn, query, ...args) {
    const rows = await dbQueryRows(conn, query, ...args);
    return rows[0];
}
