# DumpspaceUi

A personal media storage dashboard built with Angular + Firebase (Auth, Firestore, Storage).

![DumpSpace Web App](https://dumpspace-416b6.web.app/)

> Demo environment (Firebase).  
> Please sign up with your own email or use test credentials if provided.  
> Uploaded content is isolated per user.

High-level idea -
Users log in → get a personal cloud space → upload photos/videos → files stored in Firebase Storage → metadata stored in NoSQL → backend microservices manage retrieval, processing, security → Angular app shows media library.

## Development server

Important - Copy environment.example.ts -> environment.ts with respective keys and credentials. please follow the same for environment.prod.example.ts->environment.prod.ts

1) Install dependencies

```bash
npm install
```

2) To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to localhost link. The application will automatically reload whenever you modify any of the source files.

## Progress

- Auth: sign up / login
- Upload images/videos to Firebase Storage
- Metadata stored in Firestore per user
- Images page + Videos page
- Preview modal
- Download button
- Delete (Firestore + Storage)
- Dashboard: stats + recent uploads
- Backend Microservices (Work In Progress): Spring Boot, Kafka, REST APIs


