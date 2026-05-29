CREATE TABLE IF NOT EXISTS possetup (
  id       INT          NOT NULL DEFAULT 1,
  coyname  VARCHAR(100) NOT NULL DEFAULT '',
  address1 VARCHAR(100) NULL,
  address2 VARCHAR(100) NULL,
  city     VARCHAR(50)  NULL,
  postcode VARCHAR(10)  NULL,
  phone    VARCHAR(20)  NULL,
  email    VARCHAR(100) NULL,
  PRIMARY KEY (id)
);

-- Insert default row (edit coyname to your company name)
INSERT IGNORE INTO possetup (id, coyname) VALUES (1, 'PRIFE WELLNESS GALLERY');
