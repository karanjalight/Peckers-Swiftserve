-- 1️⃣ USERS TABLE
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  password_hash text not null,
  is_active boolean default true,
  is_email_verified boolean default false,
  is_phone_verified boolean default false,
  role text default 'customer', -- customer | admin | vendor
  preferences jsonb default '{}',
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_users_email on users(email);
create index idx_users_is_active on users(is_active);

-- 2️⃣ LOCATIONS TABLE
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  address_line text not null,
  city text not null,
  county text,
  postal_code text,
  is_default boolean default false,
  is_billing boolean default false,
  is_shipping boolean default true,
  label text, -- e.g. 'Home', 'Office', 'Shop'
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_locations_user_id on locations(user_id);
create index idx_locations_is_default on locations(is_default);

-- 3️⃣ PRODUCTS TABLE
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null,
  cost_price numeric(10,2),
  stock integer default 0,
  low_stock_threshold integer default 10,
  category text not null,
  subcategory text,
  sku text unique,
  barcode text unique,
  is_active boolean default true,
  is_recommended boolean default false,
  is_featured boolean default false,
  is_on_sale boolean default false,
  sale_price numeric(10,2),
  discount_percentage numeric(5,2),
  weight_kg numeric(8,3),
  dimensions_cm text, -- e.g. "10x20x30"
  supplier_id uuid,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  view_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_products_category on products(category);
create index idx_products_subcategory on products(subcategory);
create index idx_products_category_subcategory on products(category, subcategory);
create index idx_products_is_active on products(is_active);
create index idx_products_is_recommended on products(is_recommended);
create index idx_products_sku on products(sku);

-- 4️⃣ ORDERS TABLE
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  user_id uuid references users(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  status text default 'pending', -- pending | confirmed | processing | shipped | delivered | cancelled | refunded
  payment_status text default 'unpaid', -- unpaid | paid | partially_paid | refunded
  shipping_cost numeric(10,2) default 0,
  tax_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  total_amount numeric(10,2) not null default 0,
  notes text,
  is_express_shipping boolean default false,
  is_gift boolean default false,
  gift_message text,
  tracking_number text,
  estimated_delivery_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone
);

create index idx_orders_user_id on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_order_number on orders(order_number);

-- 5️⃣ ORDER ITEMS TABLE
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  price_each numeric(10,2) not null,
  discount_per_item numeric(10,2) default 0,
  subtotal numeric(10,2) generated always as ((quantity * price_each) - (quantity * discount_per_item)) stored,
  is_refunded boolean default false,
  refund_reason text,
  created_at timestamp with time zone default now()
);

create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_product_id on order_items(product_id);

-- 6️⃣ PAYMENTS TABLE
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  payment_method text not null, -- mpesa | card | bank_transfer | cash | wallet
  amount numeric(10,2) not null,
  payment_status text default 'pending', -- pending | completed | failed | cancelled
  transaction_ref text unique,
  external_transaction_id text,
  receipt_url text,
  is_manual boolean default false,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create index idx_payments_order_id on payments(order_id);
create index idx_payments_payment_status on payments(payment_status);
create index idx_payments_transaction_ref on payments(transaction_ref);

-- 7️⃣ REVIEWS TABLE (New)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  user_id uuid not null references users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean default false,
  is_helpful boolean default false,
  helpful_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_reviews_product_id on reviews(product_id);
create index idx_reviews_user_id on reviews(user_id);

-- 8️⃣ WISHLIST TABLE (New)
create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  is_notified boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

create index idx_wishlist_user_id on wishlist(user_id);

-- ✅ AUTO-UPDATE TIMESTAMPS
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_timestamp on users;
create trigger users_timestamp before update on users for each row execute function update_timestamp();

drop trigger if exists locations_timestamp on locations;
create trigger locations_timestamp before update on locations for each row execute function update_timestamp();

drop trigger if exists products_timestamp on products;
create trigger products_timestamp before update on products for each row execute function update_timestamp();

drop trigger if exists orders_timestamp on orders;
create trigger orders_timestamp before update on orders for each row execute function update_timestamp();

drop trigger if exists payments_timestamp on payments;
create trigger payments_timestamp before update on payments for each row execute function update_timestamp();

-- ✅ AUTO CALCULATE ORDER TOTAL
create or replace function update_order_total()
returns trigger as $$
begin
  update orders
  set total_amount = (
    select coalesce(sum(subtotal), 0)
    from order_items
    where order_id = new.order_id
  )
  where id = new.order_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists order_total_trigger on order_items;
create trigger order_total_trigger
after insert or update or delete
on order_items
for each row
execute function update_order_total();

-- ✅ UPDATE PRODUCT RATING AFTER REVIEW
create or replace function update_product_rating()
returns trigger as $$
begin
  update products
  set rating = (
    select round(avg(rating)::numeric, 2)
    from reviews
    where product_id = new.product_id
  ),
  review_count = (
    select count(*)
    from reviews
    where product_id = new.product_id
  )
  where id = new.product_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists review_rating_trigger on reviews;
create trigger review_rating_trigger
after insert or update or delete
on reviews
for each row
execute function update_product_rating();

-- 9️⃣ BLOGS TABLE
create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete set null,

  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,                   -- markdown or HTML
  cover_image_url text,

  tags text[] default '{}',                -- array of tags
  status text default 'draft',             -- draft | published
  view_count integer default 0,

  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_blogs_author_id on blogs(author_id);
create index idx_blogs_status on blogs(status);
create index idx_blogs_tags on blogs using gin(tags);

-- Auto-update updated_at timestamp
drop trigger if exists blogs_timestamp on blogs;

create trigger blogs_timestamp
before update on blogs
for each row
execute function update_timestamp();


CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blogs
  SET view_count = view_count + 1
  WHERE id = blog_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO anon;