import ThreeJSComponent from './graphics/src/Component';

// Create the container element
const container = document.createElement('div');
// Set width and height to 300px
container.style.width = '300px';
container.style.height = '300px';
container.style.position = 'relative'; // Ensure it takes up space in the layout

// Append the container to the body
document.body.appendChild(container);

// Initialize the ThreeJSComponent with the container
const component = new ThreeJSComponent(container);
