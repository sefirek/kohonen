export default function Neuron(type = 'input') {
  this.type = type;
  this.state = 0;
  this.weights = [];
  /**
   * @type {{input:Neuron[]}}
   */
  this.neurons = { input: [] };
  this.neighboursDistances = [];
  this.position = null;

  /**
   * 
   * @param {number} input 
   * @returns 
   */
  this.activate = (input) => {
    if (Number.isFinite(input)) {
      this.state = input;
      return;
    }
    this.state = 0;
    this.weights.forEach((weight, id) => {
      this.state += (weight - this.neurons.input[id].state) ** 2;
    });
  };

  this.generateWeights = () => {
    this.neurons.input.forEach((neuron, id) => {
      this.weights[id] = (Math.random() - 0.5) * 2;
    });
  };
}
