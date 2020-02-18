package org.acme.quickstart;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.Properties;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;



@Path("/image")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ImageProcessingResource {
	public static String KAFKA_BROKERS = "10.128.2.14:9092";
	public static String CLIENT_ID="mnist";
    public static String TOPIC_NAME="incoming";
    public static Integer MAX_NO_MESSAGE_FOUND_COUNT=3;
	
	@POST
    public Response processImage( String image ) {
		System.out.println("Received image: " + image);
		Properties prodProperties = new Properties();
	    prodProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA_BROKERS);
	    prodProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
	    prodProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

	    Producer<String, String> producer = new KafkaProducer<>(prodProperties);
	    ProducerRecord <String, String> record = new ProducerRecord<>(
                TOPIC_NAME, //topic
                "Key", //key
                image);

	    producer.send(record);
	    //System.out.println("imageData.length = " + image.length());
	    producer.close();
	    
	    final String TOPIC = "prediction";
	    Properties conProperties = new Properties();
	    conProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA_BROKERS);
	    conProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class.getName());
	    conProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class.getName());
	    conProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
	    conProperties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        conProperties.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 10);
	    conProperties.put("group.id", "result");
	    Consumer<byte[],byte[]> consumer = new KafkaConsumer<>(conProperties);
        consumer.subscribe(Collections.singletonList(TOPIC));
        String value = new String();
        int noMessageFound = 0;
        String message = new String();
    	while (true) {
 
            ConsumerRecords<byte[], byte[]> consumerRecords = consumer.poll(Duration.ofMillis(2000));
            System.out.println("Fetched " + consumerRecords.count() + " records");
            if (consumerRecords.count() == 0) {
                noMessageFound++;
               
                if (noMessageFound > MAX_NO_MESSAGE_FOUND_COUNT)
                  // If no message found count is reached to threshold exit loop.  
                  break;
                else
                    continue;
            }

            for (ConsumerRecord<byte[],byte[]> consumerRecord : consumerRecords) {
            	String key = new String(consumerRecord.key(), StandardCharsets.UTF_8);
            	value = new String(consumerRecord.value(), StandardCharsets.UTF_8);
                System.out.printf("Consumer Record:\n" + key + "\n" + value);
                String arr[] = value.split("\\s+");
                message = Arrays.toString(arr).substring(1,Arrays.toString(arr).length()-1);
                System.out.println("\nmessage: "+message);
                int maxIdx = 0;
                double max = Double.parseDouble(arr[0]);
                for(int i=1; i < arr.length; i++) {
                	double d = Double.parseDouble(arr[i]);
                	if(d>max) {
                		max = d;
                		maxIdx = i;
                	}
                	
                }
                System.out.println("Prediction is: " + maxIdx);
            };
	            consumer.commitAsync();
	            //
    	}
    	consumer.close();
    	System.out.println("response: " + message);
        System.out.println("DONE");
        return Response
              .status(Response.Status.OK)
              .entity(message)
              .type(MediaType.APPLICATION_JSON)
              .build();
	}
}
