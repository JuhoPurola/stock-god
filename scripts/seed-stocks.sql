-- Seed popular stocks for trading
-- This includes major tech stocks, blue chips, and popular trading symbols

INSERT INTO stocks (symbol, name, exchange, sector, industry, market_cap, tradable) VALUES
-- Tech Giants (FAANG+)
('AAPL', 'Apple Inc.', 'NASDAQ', 'Technology', 'Consumer Electronics', 3000000000000, true),
('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', 'Software', 2800000000000, true),
('GOOGL', 'Alphabet Inc. Class A', 'NASDAQ', 'Technology', 'Internet Services', 1700000000000, true),
('AMZN', 'Amazon.com Inc.', 'NASDAQ', 'Consumer Cyclical', 'Internet Retail', 1500000000000, true),
('META', 'Meta Platforms Inc.', 'NASDAQ', 'Technology', 'Social Media', 900000000000, true),
('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Technology', 'Semiconductors', 1200000000000, true),
('TSLA', 'Tesla Inc.', 'NASDAQ', 'Consumer Cyclical', 'Auto Manufacturers', 800000000000, true),
('NFLX', 'Netflix Inc.', 'NASDAQ', 'Communication Services', 'Entertainment', 200000000000, true),

-- Other Major Tech
('AMD', 'Advanced Micro Devices Inc.', 'NASDAQ', 'Technology', 'Semiconductors', 180000000000, true),
('INTC', 'Intel Corporation', 'NASDAQ', 'Technology', 'Semiconductors', 150000000000, true),
('CRM', 'Salesforce Inc.', 'NYSE', 'Technology', 'Software', 250000000000, true),
('ORCL', 'Oracle Corporation', 'NYSE', 'Technology', 'Software', 300000000000, true),
('ADBE', 'Adobe Inc.', 'NASDAQ', 'Technology', 'Software', 280000000000, true),
('CSCO', 'Cisco Systems Inc.', 'NASDAQ', 'Technology', 'Networking', 200000000000, true),
('QCOM', 'QUALCOMM Inc.', 'NASDAQ', 'Technology', 'Semiconductors', 180000000000, true),
('AVGO', 'Broadcom Inc.', 'NASDAQ', 'Technology', 'Semiconductors', 500000000000, true),

-- Finance
('JPM', 'JPMorgan Chase & Co.', 'NYSE', 'Financial Services', 'Banks', 450000000000, true),
('BAC', 'Bank of America Corp.', 'NYSE', 'Financial Services', 'Banks', 350000000000, true),
('WFC', 'Wells Fargo & Co.', 'NYSE', 'Financial Services', 'Banks', 180000000000, true),
('GS', 'Goldman Sachs Group Inc.', 'NYSE', 'Financial Services', 'Investment Banking', 120000000000, true),
('MS', 'Morgan Stanley', 'NYSE', 'Financial Services', 'Investment Banking', 150000000000, true),
('V', 'Visa Inc.', 'NYSE', 'Financial Services', 'Payment Systems', 500000000000, true),
('MA', 'Mastercard Inc.', 'NYSE', 'Financial Services', 'Payment Systems', 380000000000, true),
('PYPL', 'PayPal Holdings Inc.', 'NASDAQ', 'Financial Services', 'Payment Systems', 70000000000, true),

-- Healthcare
('JNJ', 'Johnson & Johnson', 'NYSE', 'Healthcare', 'Pharmaceuticals', 400000000000, true),
('UNH', 'UnitedHealth Group Inc.', 'NYSE', 'Healthcare', 'Health Insurance', 500000000000, true),
('PFE', 'Pfizer Inc.', 'NYSE', 'Healthcare', 'Pharmaceuticals', 150000000000, true),
('ABBV', 'AbbVie Inc.', 'NYSE', 'Healthcare', 'Pharmaceuticals', 280000000000, true),
('TMO', 'Thermo Fisher Scientific Inc.', 'NYSE', 'Healthcare', 'Medical Equipment', 220000000000, true),
('ABT', 'Abbott Laboratories', 'NYSE', 'Healthcare', 'Medical Equipment', 200000000000, true),
('LLY', 'Eli Lilly and Co.', 'NYSE', 'Healthcare', 'Pharmaceuticals', 600000000000, true),

-- Consumer
('KO', 'Coca-Cola Co.', 'NYSE', 'Consumer Defensive', 'Beverages', 260000000000, true),
('PEP', 'PepsiCo Inc.', 'NASDAQ', 'Consumer Defensive', 'Beverages', 240000000000, true),
('WMT', 'Walmart Inc.', 'NYSE', 'Consumer Defensive', 'Discount Stores', 420000000000, true),
('HD', 'Home Depot Inc.', 'NYSE', 'Consumer Cyclical', 'Home Improvement', 380000000000, true),
('NKE', 'NIKE Inc.', 'NYSE', 'Consumer Cyclical', 'Apparel', 150000000000, true),
('MCD', 'McDonald''s Corp.', 'NYSE', 'Consumer Cyclical', 'Restaurants', 200000000000, true),
('SBUX', 'Starbucks Corp.', 'NASDAQ', 'Consumer Cyclical', 'Restaurants', 110000000000, true),
('DIS', 'Walt Disney Co.', 'NYSE', 'Communication Services', 'Entertainment', 180000000000, true),

-- Industrial & Energy
('BA', 'Boeing Co.', 'NYSE', 'Industrials', 'Aerospace & Defense', 120000000000, true),
('CAT', 'Caterpillar Inc.', 'NYSE', 'Industrials', 'Construction Equipment', 160000000000, true),
('GE', 'General Electric Co.', 'NYSE', 'Industrials', 'Conglomerates', 120000000000, true),
('XOM', 'Exxon Mobil Corp.', 'NYSE', 'Energy', 'Oil & Gas', 420000000000, true),
('CVX', 'Chevron Corp.', 'NYSE', 'Energy', 'Oil & Gas', 280000000000, true),

-- Retail & E-commerce
('COST', 'Costco Wholesale Corp.', 'NASDAQ', 'Consumer Defensive', 'Discount Stores', 350000000000, true),
('TGT', 'Target Corp.', 'NYSE', 'Consumer Defensive', 'Discount Stores', 70000000000, true),

-- Telecom
('T', 'AT&T Inc.', 'NYSE', 'Communication Services', 'Telecom', 130000000000, true),
('VZ', 'Verizon Communications Inc.', 'NYSE', 'Communication Services', 'Telecom', 170000000000, true),

-- Popular Growth/Meme Stocks
('PLTR', 'Palantir Technologies Inc.', 'NYSE', 'Technology', 'Software', 50000000000, true),
('RIVN', 'Rivian Automotive Inc.', 'NASDAQ', 'Consumer Cyclical', 'Auto Manufacturers', 15000000000, true),
('LCID', 'Lucid Group Inc.', 'NASDAQ', 'Consumer Cyclical', 'Auto Manufacturers', 8000000000, true),
('COIN', 'Coinbase Global Inc.', 'NASDAQ', 'Financial Services', 'Cryptocurrency', 40000000000, true),
('RBLX', 'Roblox Corp.', 'NYSE', 'Communication Services', 'Gaming', 25000000000, true),
('SNOW', 'Snowflake Inc.', 'NYSE', 'Technology', 'Software', 50000000000, true),
('ZM', 'Zoom Video Communications Inc.', 'NASDAQ', 'Technology', 'Software', 20000000000, true),
('SHOP', 'Shopify Inc.', 'NYSE', 'Technology', 'E-commerce', 80000000000, true),
('SQ', 'Block Inc. (Square)', 'NYSE', 'Financial Services', 'Payment Systems', 35000000000, true),
('UBER', 'Uber Technologies Inc.', 'NYSE', 'Consumer Cyclical', 'Ridesharing', 120000000000, true),
('LYFT', 'Lyft Inc.', 'NASDAQ', 'Consumer Cyclical', 'Ridesharing', 6000000000, true),
('ABNB', 'Airbnb Inc.', 'NASDAQ', 'Consumer Cyclical', 'Travel', 80000000000, true),
('TWLO', 'Twilio Inc.', 'NYSE', 'Technology', 'Software', 10000000000, true),
('SPOT', 'Spotify Technology SA', 'NYSE', 'Communication Services', 'Music Streaming', 50000000000, true),
('ROKU', 'Roku Inc.', 'NASDAQ', 'Technology', 'Streaming', 10000000000, true)

ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    exchange = EXCLUDED.exchange,
    sector = EXCLUDED.sector,
    industry = EXCLUDED.industry,
    market_cap = EXCLUDED.market_cap,
    tradable = EXCLUDED.tradable,
    updated_at = NOW();
