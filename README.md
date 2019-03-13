# omnio_api

1. install dependencies (npm i)
2. set an environmental variable named CS and assign it to the connection string of the gateway device 
(e.g:CS=HostName=myiothub.azure-devices.net;DeviceId=mydeviceid;SharedAccessKey=mySASKey)
3. set an environmental variable named timerPrint and set to true if execution times is desired
4. set an environmental variable named and set it to the gateway type 
(e.g. device={"type": "FC102", "id": "mydev"}
5. set DEBUG=* when debugging 