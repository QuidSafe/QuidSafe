CREATE INDEX IF NOT EXISTS idx_transactions_income_date ON transactions(user_id, is_income, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_confidence ON transactions(user_id, ai_confidence);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_tx ON transactions(bank_transaction_id, user_id);
