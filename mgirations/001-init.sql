create table messages (
    id integer primary key,
    content text,
    authorId text,
    scheduled boolean default false, 
    published boolean default false,
    createdAt text
);
