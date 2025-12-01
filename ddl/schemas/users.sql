create sequence if not exists users_id_seq start 1;

create table if not exists users (
  id integer primary key default nextval('users_id_seq'::regclass),
  email text not null,
  active boolean default true,
  created_at timestamp default now()
);

create table if not exists orders (
  id integer primary key,
  total numeric
);
