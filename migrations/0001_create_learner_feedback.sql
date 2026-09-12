CREATE TABLE learner_feedback (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 500),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total BETWEEN 1 AND 100 AND score <= total),
  app_revision TEXT NOT NULL CHECK (length(app_revision) BETWEEN 1 AND 64),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX learner_feedback_expires_at
  ON learner_feedback (expires_at);
