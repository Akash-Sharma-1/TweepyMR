from textblob import TextBlob
from firebase import firebase
import json
from langdetect import detect

def merge(arr,l,m,r):
	n1=m-l+1
	n2=r-m
	L=[0]*(n1)
	R=[0]*(n2)

	for i in range(0,n1):
		L[i]=arr[l+i]
	for j in range(0,n2):
		R[j]=arr[m+1+j]

	i=0
	j=0
	k=l

	while i<n1 and j<n2:
		if(L[i]["count"]<=R[j]["count"]):
			arr[k]=R[j]
			j+=1
		else:
			arr[k]=L[i]
			i+=1
		k+=1
	while i<n1:
		arr[k]=L[i]
		i+=1
		k+=1
	while j<n2:
		arr[k]=R[j]
		j+=1
		k+=1

def mergeSort(arr,l,r):
	if l<r:
		m=(l+(r-1))//2
		mergeSort(arr,l,m)
		mergeSort(arr,m+1,r)
		merge(arr,l,m,r)

firebase=firebase.FirebaseApplication('https://tweepy-7845f.firebaseio.com/',None)
print("Fetching DB...")
result=firebase.get('/Rahul_',None)
print("DB fetched")
recentWords={}
print("Analysing DB...")
for i in range(len(result)):
	blob=TextBlob(result[i].get("text"))
	d=blob.tags
	for t in range(len(d)):
		if(len(d[t][0]))>2 and d[t][0].isalpha():
			if d[t][1]=='NNP':
				if d[t][0] not in recentWords:
					recentWords[d[t][0]]=1
				else:
					recentWords[d[t][0]]+=1

wordsToBeSearched=[]
for key in recentWords.keys():
	if(recentWords[key]>=10):
		data={}
		data['word']=key
		data['count']=recentWords[key]
		wordsToBeSearched.append(data)
print("Analysis done")
print(str(len(wordsToBeSearched))+" words")

print("Sorting words...")
mergeSort(wordsToBeSearched,0,len(wordsToBeSearched)-1)
print("Done sorting")
jsonString=json.dumps(wordsToBeSearched)
print("Uploading to firebase...")
firebase.put('/','Most_Used_Words_Rahul/0',jsonString)
print("Done uploading")




