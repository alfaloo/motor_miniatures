import csv
import pymysql

conn = pymysql.connect(
    host='',
    user='',
    password='',
    database=''
)
cursor = conn.cursor()
cursor.execute("SELECT id, brand, make, model, variant, scale, serial_number, production_count, grade, purchase_price, purchase_platform, purchase_year, purchase_month, is_preorder, received_year, received_month, is_sold, sold_price, sold_platform, sold_year, sold_month FROM item")

with open('items.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([d[0] for d in cursor.description])  # header
    writer.writerows(cursor.fetchall())

cursor.execute("SELECT id, author_id, item_id, created, category, description FROM comment")

with open('comments.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([d[0] for d in cursor.description])  # header
    writer.writerows(cursor.fetchall())

conn.close()
