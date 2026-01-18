// Another example URL: https://dev.to/damiisdandy/pagination-in-javascript-and-react-with-a-custom-usepagination-hook-1mgo
export default function paginator(items, page, perPage = 10) {
    const totalPages = Math.ceil(items.length / perPage);
    const currPage = page >= 1 && page <= totalPages ? page : 1;
    const offset = (currPage - 1) * perPage;
    const itemsCurrPage = items.slice(offset, offset + perPage);

    /* eslint-disable sort-keys-fix/sort-keys-fix */
    return {
        items: itemsCurrPage,
        total: items.length,
        prevPage: currPage >= 2 ? currPage - 1 : undefined,
        currPage,
        nextPage: currPage < totalPages ? currPage + 1 : undefined,
        totalPages,
        perPage,
    };
    /* eslint-enable sort-keys-fix/sort-keys-fix */
}
