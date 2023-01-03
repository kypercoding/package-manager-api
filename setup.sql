CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE environments (
    env_id UUID PRIMARY KEY,
    json_data JSONB NOT NULL
);

CREATE TABLE env_relations (
    user_id UUID NOT NULL,
    env_id UUID NOT NULL,
    PRIMARY KEY (user_id, env_id)
);
