import Neuron from './Neuron.js';

export default function Layer(size, type = 'input') {
  this.neurons = [];
  for (let i = 0; i < size; i += 1) {
    this.neurons.push(new Neuron(type));
  }

  /**
   *
   * @param {Layer} layer
   */
  this.connect = (layer) => {
    layer.neurons.forEach((neuron) => {
      neuron.neurons.input.push(...this.neurons);
      neuron.generateWeights();
    });
  };
}
