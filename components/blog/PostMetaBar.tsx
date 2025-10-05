import React from "react";

export function PostMetaBar({ title, date, readingTime, author }: { title:string; date:string; readingTime?:string; author?:{name:string;avatar?:string} }) {
  return (
    <header className="mx-auto max-w-3xl px-4 pt-10 text-center">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink">{title}</h1>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted">
        {author?.avatar && <img src={author.avatar} alt={author.name} className="h-6 w-6 rounded-full" />}
        {author?.name && <span>{author.name}</span>}
        <span>•</span>
        <time dateTime={date}>{new Date(date).toLocaleDateString('ro-RO')}</time>
        {readingTime && <><span>•</span><span>{readingTime}</span></>}
      </div>
    </header>
  );
}


