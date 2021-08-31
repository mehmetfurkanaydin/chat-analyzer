# chat-analyzer

chat analyzer for whatsapp exports

1 - Select the Whatsapp chat which you want to analyze and export without media. It will create txt file of the chat.

2 - Run `docker-compose up`. It will start Elasticsearch and Kibana instances.

3 - Run `node index.js path_to_your_export_chat.txt` . This will read the txt file and insert the data in the `messages` index.

4 - Go to `http://localhost:5601/` and start analyzing your chat via Kibana. You can find all your chat data in the `messages` index.
