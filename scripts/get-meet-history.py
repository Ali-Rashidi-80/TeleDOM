import sqlite3
import os
import sys
import datetime
import shutil

sys.stdout.reconfigure(encoding='utf-8')

src = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Default\History')
tmp = 'temp_hist.db'

try:
    shutil.copyfile(src, tmp)
    conn = sqlite3.connect(tmp)
    cur = conn.cursor()

    query = '''
    SELECT url, title, visit_count, last_visit_time 
    FROM urls 
    WHERE url LIKE '%meet.google.com%' 
    ORDER BY last_visit_time DESC 
    LIMIT 20
    '''

    cur.execute(query)
    rows = cur.fetchall()

    def chrome_time_to_dt(chrome_time):
        if not chrome_time:
            return 'N/A'
        epoch_start = datetime.datetime(1601, 1, 1, tzinfo=datetime.timezone.utc)
        delta = datetime.timedelta(microseconds=chrome_time)
        dt = epoch_start + delta
        # Tehran UTC+3:30
        tehran_tz = datetime.timezone(datetime.timedelta(hours=3, minutes=30))
        local_dt = dt.astimezone(tehran_tz)
        return local_dt.strftime('%Y-%m-%d %H:%M:%S (%Z)')

    print('=== RECENT GOOGLE MEET VISITS & SESSIONS ===')
    for r in rows:
        url, title, count, last_time = r
        print(f'• Time: {chrome_time_to_dt(last_time)}')
        print(f'  Title: {title}')
        print(f'  URL: {url}')
        print(f'  Visit Count: {count}')
        print('-'*50)

    conn.close()
finally:
    if os.path.exists(tmp):
        try:
            os.remove(tmp)
        except:
            pass
