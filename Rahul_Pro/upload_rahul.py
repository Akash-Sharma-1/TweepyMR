from firebase import firebase
import json
firebase=firebase.FirebaseApplication('https://tweepy-7845f.firebaseio.com/',None)
# result=firebase.get('/Tweets',None)
path="rahulgandhi_short.json"
file=open(path,'r')
file=file.read()
j=json.loads(file)
# for i in range(len(j)):
	# result.append(j[i])
firebase.put('/','Rahul_',j)