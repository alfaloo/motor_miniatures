import csv
import psycopg2
import uuid

NEON_URL = ""  # your direct (non-pooled) Neon connection string
USER_ID = ""

def nullable(val):
    return None if val in ('', 'None') else val

conn = psycopg2.connect(NEON_URL)
cur = conn.cursor()

# Clear existing data (comments cascade-delete with items)
cur.execute("DELETE FROM items")
print("Cleared items table")

# Insert items, tracking old integer id -> new UUID
id_map = {}  # old_id (str) -> new UUID

with open('items.csv', newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        new_id = str(uuid.uuid4())
        id_map[row['id']] = new_id
        cur.execute("""
            INSERT INTO items (
                id, user_id,
                brand, make, model, variant, scale,
                serial_number, production_count, grade,
                purchase_price, purchase_platform, purchase_year, purchase_month,
                is_preorder, received_year, received_month,
                is_sold, sold_price, sold_platform, sold_year, sold_month,
                created_at
            ) VALUES (
                %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s,
                NOW()
            )
        """, (
            new_id, USER_ID,
            row['brand'], row['make'], row['model'], row['variant'], row['scale'],
            nullable(row['serial_number']), nullable(row['production_count']), nullable(row['grade']),
            row['purchase_price'], row['purchase_platform'], row['purchase_year'], row['purchase_month'],
            row['is_preorder'] == '1', nullable(row['received_year']), nullable(row['received_month']),
            row['is_sold'] == '1', nullable(row['sold_price']), nullable(row['sold_platform']),
            nullable(row['sold_year']), nullable(row['sold_month']),
        ))

print(f"Inserted {len(id_map)} items")

# Insert comments, mapping old item_id to new UUID
skipped = 0
inserted = 0

with open('comments.csv', newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        new_item_id = id_map.get(row['item_id'])
        if not new_item_id:
            print(f"  Warning: skipping comment {row['id']} — item_id {row['item_id']} not found in items.csv")
            skipped += 1
            continue
        cur.execute("""
            INSERT INTO comments (
                id, user_id, item_id,
                title, description, created_at
            ) VALUES (
                gen_random_uuid(), %s, %s,
                %s, %s, %s
            )
        """, (
            USER_ID, new_item_id,
            row['category'], row['description'], row['created'],
        ))
        inserted += 1

print(f"Inserted {inserted} comments, skipped {skipped}")

conn.commit()
cur.close()
conn.close()
print("Done")
