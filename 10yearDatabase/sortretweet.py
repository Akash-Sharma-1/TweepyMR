import json
from datetime import datetime

#datetime_object = datetime.strptime('Jun 1 2005  1:33PM', '%b %d %Y %I:%M%p')
input_file=open('narendramodi_short.json', 'r')
json_decode=json.load(input_file)
summ = 0
summ2=0

lines = sorted(json_decode, key=lambda k: datetime.strptime(k['created_at'],'%a %b %d %H:%M:%S %z %Y'), reverse=True)

for item in lines[:10]:
    a=item.get('retweet_count')
    b=item.get('favorite_count')
    summ = summ + a
    summ2 = summ2 + b
print(summ/10)
print(summ2/10)
