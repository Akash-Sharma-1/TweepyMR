import json
from firebase import firebase
query=input()
query=query.lower()
firebase=firebase.FirebaseApplication('https://tweepy-7845f.firebaseio.com/',None)
result=firebase.get('/Tweets',None)
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

