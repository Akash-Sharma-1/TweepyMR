from firebase import firebase
import json
firebase=firebase.FirebaseApplication('https://tweepy-7845f.firebaseio.com/',None)
path="narendramodi_short.json"
file=open(path,'r')
file=file.read()
j=json.loads(file)
result=firebase.put('/','Tweets',j)