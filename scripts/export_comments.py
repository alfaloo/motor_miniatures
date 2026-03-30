import csv
import pymysql

conn = pymysql.connect(
    host='',
    user='',
    password='',
    database=''
)
cursor = conn.cursor()
cursor.execute("SELECT id, author_id, item_id, created, category, description FROM comment")

with open('comments.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([d[0] for d in cursor.description])  # header
    writer.writerows(cursor.fetchall())

conn.close()
