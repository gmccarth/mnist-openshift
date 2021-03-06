import requests
import keras
from keras.models import load_model
import tensorflow as tf
import os
from kafka import KafkaConsumer, KafkaProducer
from time import sleep
import numpy as np
import json
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
mnist_file_url = "https://raw.githubusercontent.com/gmccarth/mnist-openshift/master/src/main/resources/assets/mnist.h5"
mnist_file = requests.get(mnist_file_url)
open('mnist.h5', 'wb').write(mnist_file.content)
print("Model downloaded")
model = load_model('mnist.h5',custom_objects={'softmax_v2': tf.nn.softmax})
bootstrap_servers = ['my-cluster-kafka-bootstrap.mnist-demo.svc:9092']
print("bootstrap_servers: {}".format(bootstrap_servers))

#model.summary()
print("Ready")
consumer = KafkaConsumer("incoming", bootstrap_servers=bootstrap_servers, api_version=(0, 10))
#consumer.subscribe('incoming')

producer = KafkaProducer(bootstrap_servers=bootstrap_servers, api_version=(0,10))
pred_key = "prediction"

#read from incoming topic
for message in consumer:
	digit = message.key
	incoming = message.value
	#print("incoming: {}".format(incoming))
	message_dict = json.loads(incoming)
	image_array = np.asarray(message_dict)

	prediction = model.predict(image_array)
	np.set_printoptions(precision=10,suppress=True);

	print("prediction : {}".format(prediction.argmax()))
	
	pred_value = str(prediction)
	pred_value = pred_value[2:-2]
	print("prediction results: {}".format(pred_value))
	#publish to prediction topic
	producer.send("prediction", key=pred_key.encode('utf-8') ,value=pred_value.encode('utf-8'))
	producer.flush()
	sleep(5)
consumer.close()






