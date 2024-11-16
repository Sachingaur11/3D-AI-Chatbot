
# 3D-chatbot

## Project Overview
This project is a 3D chatbot application that uses React for the frontend and Node.js for the backend. The chatbot features a virtual avatar that can display various facial expressions and animations based on the user's input.

![Screenshot 2024-11-16 at 6 41 51 AM](https://github.com/user-attachments/assets/a6016caa-030a-47cf-baa6-4433808b761b)

## Frontend
The frontend of the application is located in the `Frontend` folder. 

### App.jsx
This is the main entry point of the application. It sets up the 3D canvas, loader, and user interface.

## Avatar Component

The `Avatar` component is a key part of the 3D chatbot application, responsible for rendering and animating the virtual avatar. It utilizes the `@react-three/drei` and `@react-three/fiber` libraries to manage 3D models and animations.

### Features

- **Facial Expressions**: The avatar can display a range of facial expressions such as smile, happy, sad, surprised, and angry. These expressions are defined using morph target influences on the 3D model.
  
- **Animations**: The component supports various animations, which can be controlled dynamically based on user input or chat messages. The animation speed can be adjusted using a control panel.

- **Lip Syncing**: The avatar's mouth movements are synchronized with audio playback to simulate realistic speech.

- **Interactive Controls**: Users can interact with the avatar using a control panel powered by `leva`, allowing them to trigger expressions, animations, and other features.

### Usage

The `Avatar` component is located in `Frontend/src/components/Avatar.jsx`. It is designed to be used within a React application that supports 3D rendering with Three.js.

### Key Dependencies

- **@react-three/drei**: Provides useful helpers for working with Three.js in React.
- **@react-three/fiber**: A React renderer for Three.js, enabling the use of Three.js within React components.
- **leva**: A GUI library for React, used to create control panels for adjusting the avatar's properties.

### How It Works

1. **Model Loading**: The avatar model is downloaded from the Ready Player Me website as a .glb file. Animations are created using Mixamo without skin and merged together into one .glb file. The component loads these 3D models and animations using the `useGLTF` hook.
2. **Animation Control**: Animations are managed using the `useAnimations` hook, allowing for smooth transitions and speed adjustments.
3. **Facial Expression Mapping**: Facial expressions are mapped to morph targets on the 3D model, which are adjusted in real-time based on user input or chat messages.
4. **Audio Playback**: Audio is played using the HTML5 Audio API, with events to handle playback completion and errors.

### Customization

Developers can customize the avatar by modifying the facial expressions, animations, and control panel settings in the `Avatar.jsx` file. The component is designed to be flexible and extendable, allowing for the addition of new features and expressions.

### Preloading

The component preloads necessary 3D models and animations to ensure smooth performance and quick loading times.

## Backend
The backend of the application is located in the `backend` folder. The main file is `index.js`, which plays a crucial role in handling server-side logic and communication with the frontend.

## Running the Application
To run the application, navigate to both the `Frontend` and `backend` folders and run `npm run dev` in each folder.
