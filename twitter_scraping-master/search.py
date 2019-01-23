import json
import time
from firebase import firebase
query=input()
query=query.lower()
#firebase=firebase.FirebaseApplication('https://tweepy-7845f.firebaseio.com/',None)
#result=firebase.get('/Tweets',None)
start=time.time()
path='narendramodi_short.json'
result=open(path,'r')
result=result.read()
result=json.loads(result)
ids=[]
for i in range(len(result)):
	tweet=result[i]
	text=tweet.get("text")
	text=text.lower()
	if text.find(query)!=-1:
		ids.append(tweet.get("id_str"))
if(len(ids)==0):
	print("No results found")
else:
	print(ids)
print(len(ids))
print(time.time()-start)

