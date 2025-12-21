import React from 'react';

function Highlighter({ isFullMatch = false, searchTerm, text, ...props }) {
    text = String(text);
    if (isFullMatch && text === searchTerm) {
        return (
            <span style={{ backgroundColor: 'yellow' }} {...props}>
                {text}
            </span>
        );
    }

    if (!isFullMatch) {
        text = text.replace(
            new RegExp(escapeRegExp(searchTerm), 'gi'),
            (match) => `<span style="background-color: yellow;">${match}</span>`,
        );
    }
    return <span dangerouslySetInnerHTML={{ __html: text }} {...props}></span>;
}

function escapeRegExp(str) {
    // $& => Last match, URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastMatch
    const reRegExpEscape = /([\].|*?+(){}^$\\:=[])/g;
    return str.replace(reRegExpEscape, '\\$&');
}
