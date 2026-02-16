-- Generate sample price data for all stocks
-- This creates 365 days of realistic price data using a random walk

DO $$
DECLARE
  stock_symbol TEXT;
  current_price NUMERIC;
  days_back INTEGER := 365;
  i INTEGER;
  day_date DATE;
  price_open NUMERIC;
  price_high NUMERIC;
  price_low NUMERIC;
  price_close NUMERIC;
  daily_change NUMERIC;
  day_volatility NUMERIC;
  price_volume BIGINT;
BEGIN
  -- Loop through all stocks
  FOR stock_symbol IN SELECT symbol FROM stocks ORDER BY symbol
  LOOP
    -- Random starting price between $50 and $500
    current_price := 50 + (RANDOM() * 450);

    -- Generate price data for each day
    FOR i IN REVERSE days_back..1 LOOP
      day_date := CURRENT_DATE - i;

      -- Random walk: -3% to +3% daily change
      daily_change := (RANDOM() - 0.5) * 0.06;
      current_price := current_price * (1 + daily_change);

      -- Ensure price stays above $1
      IF current_price < 1 THEN
        current_price := 1 + RANDOM() * 10;
      END IF;

      -- Generate OHLC with realistic intraday variation
      day_volatility := RANDOM() * 0.02; -- 0-2% intraday range

      price_open := current_price * (1 + (RANDOM() - 0.5) * day_volatility);
      price_close := current_price;
      price_high := GREATEST(price_open, price_close) * (1 + RANDOM() * day_volatility);
      price_low := LEAST(price_open, price_close) * (1 - RANDOM() * day_volatility);
      price_volume := 1000000 + FLOOR(RANDOM() * 10000000);

      -- Insert or update price data
      INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES (
        stock_symbol,
        day_date,
        ROUND(price_open::numeric, 4),
        ROUND(price_high::numeric, 4),
        ROUND(price_low::numeric, 4),
        ROUND(price_close::numeric, 4),
        price_volume
      )
      ON CONFLICT (symbol, date) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        updated_at = NOW();
    END LOOP;

    RAISE NOTICE 'Generated % days of price data for %', days_back, stock_symbol;
  END LOOP;
END $$;

-- Show summary
SELECT
  COUNT(DISTINCT symbol) as symbols_with_data,
  COUNT(*) as total_price_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM stock_prices;
