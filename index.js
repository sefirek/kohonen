import Layer from './Layer.js';
import arrayShuffle from 'array-shuffle';

/**
 *
 * @param {number | JSON} inputSize
 * @param {number} width
 * @param {number} height
 */
export default function Kohonen(inputSize, width, height) {
  const json = (arguments.length === 1 && inputSize) || {};
  this.inputSize = json.inputSize || inputSize;
  this.width = json.width || width;
  this.height = json.height || height;
  this.minDistance = 2;
  const inputLayer = new Layer(this.inputSize, 'input');
  const outputLayer = new Layer(this.width * this.height, 'output');
  const radius = Math.sqrt(this.width ** 2 + this.height ** 2);
  this.winnerId = 0;
  this.lambda = Math.sqrt(this.width * this.height) / 2;
  inputLayer.connect(outputLayer);
  for (let x = 0; x < this.width; x += 1) {
    for (let y = 0; y < this.height; y += 1) {
      outputLayer.neurons[y * this.width + x].position = { x, y };
    }
  }
  if (json.weights) {
    json.weights.forEach((weights, id) => {
      Object.assign(outputLayer.neurons[id], { weights });
    });
  }

  calculateDistances.bind(this)();

  function calculateDistances() {
    outputLayer.neurons.forEach((neuron) => {
      outputLayer.neurons.forEach((neighbour, id) => {
        const distance =
          (neuron.position.x - neighbour.position.x) ** 2 +
          (neuron.position.y - neighbour.position.y) ** 2;
        neuron.neighboursDistances[id] = -0.5 * distance;
      });
    });
  }

  this.activate = (input) => {
    input.forEach((arg, id) => {
      try {
        inputLayer.neurons[id].activate(arg);
      } catch (e) {
        console.log({ input });
        throw e;
      }
    });
    this.winnerId = 0;
    let min = 100;
    let max = -100;
    outputLayer.neurons.forEach((neuron, id) => {
      neuron.activate();
      min = Math.min(min, neuron.state);
      max = Math.max(max,neuron.state);
      if (outputLayer.neurons[this.winnerId].state > neuron.state) {
        this.winnerId = id;
      }
    });
    outputLayer.neurons.forEach((neuron) => {
      neuron.state = (neuron.state-min)/(max-min);
    });
    return this;
  };

  this.train = (
    dataset,
    opt = {
      lambdaFunction: null,
      iterations: 100,
      log: 10,
      rate: 0.3,
    }
  ) => {
    opt.lambdaFunction =
      opt.lambdaFunction || ((iteration) => (radius - this.minDistance) * (iteration / opt.iterations) + this.minDistance); 
    opt.rate = opt.rate || 0.3;
    opt.iterations = opt.iterations || 100;
    for (let i = 0; i < opt.iterations; i += 1) {
      this.lambda = opt.lambdaFunction(i);
      arrayShuffle(dataset).forEach((input) => {
        this.activate(input);
        const winnerNeuron = outputLayer.neurons[this.winnerId];
        outputLayer.neurons.forEach((neuron, id) => {
          neuron.weights.forEach((weight, weightId) => {
            neuron.weights[weightId] +=
              (input[weightId] - weight) *
              Math.exp(winnerNeuron.neighboursDistances[id] / this.lambda ** 2) *
              opt.rate;
          });
        });
      });
      if (opt.log && i % opt.log === 0) console.log('iteration', i);
    }
    return this;
  };

  /**
   *
   * @returns {number[][]}
   */
  this.getIdentityMatrix = () => {
    const matrix = [];
    for (let y = 0; y < this.height; y += 1) {
      matrix.push(new Array(this.width).fill(0));
    }
    const winnerNeuron = outputLayer.neurons[this.winnerId];
    matrix[winnerNeuron.position.y][winnerNeuron.position.x] = 1;
    return matrix;
  };

  /**
   *
   * @returns {number[]}
   */
  this.getIdentityOutput = () => {
    const output = new Array(this.width * this.height).fill(0);
    output[this.winnerId] = 1;
    return output;
  };

  /**
   *
   * @returns {number[][]}
   */
  this.getHeatmap = () => {
    const matrix = [];
    for (let y = 0; y < this.height; y += 1) {
      matrix.push(new Array(this.width).fill(0));
    }
    let min = 100;
    let max = -100;
    outputLayer.neurons.forEach((neuron, id) => {
      min = Math.min(min, neuron.state);
      max = Math.max(max,neuron.state);
    });
    outputLayer.neurons.forEach((neuron) => {
      matrix[neuron.position.y][neuron.position.x] = (neuron.state-min)/(max-min);
    });
    return matrix;
  };

  this.getWinnerNeuron = () => outputLayer.neurons[this.winnerId];
  /**
   *
   * @param {number} id
   * @returns {Neuron}
   */
  this.getNeuron = (id) => outputLayer.neurons[id] || null;
  /**
   *
   * @param {number[][]} dataset
   * @returns {Neuron[]}
   */
  this.getHotNeurons = (dataset) => {
    const hottest = new Set();
    dataset.forEach((input) => {
      this.activate(input);
      hottest.add(this.winnerId);
    });
    return [...hottest].map((id) => outputLayer.neurons[id]);
  };

  this.toJSON = () => ({
    inputSize: this.inputSize,
    width: this.width,
    height: this.height,
    weights: outputLayer.neurons.map(({ weights }) => [...weights]),
  });
}
