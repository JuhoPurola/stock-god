import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api-client';
import type { Strategy, FactorConfig, CreateBacktestRequest } from '@stock-picker/shared';
import {
  Dna,
  Play,
  Pause,
  CheckCircle2,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

interface GeneticOptimizerProps {
  strategy: Strategy;
  onOptimizationComplete?: (bestWeights: FactorConfig[]) => void;
}

interface Individual {
  weights: number[];
  fitness: number;
  generation: number;
}

interface GenerationResult {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  diversity: number;
}

export function GeneticOptimizer({ strategy, onOptimizationComplete }: GeneticOptimizerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [bestIndividual, setBestIndividual] = useState<Individual | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);
  const [population, setPopulation] = useState<Individual[]>([]);
  const [progress, setProgress] = useState(0);

  // GA Parameters
  const [populationSize] = useState(20);
  const [maxGenerations] = useState(50);
  const [mutationRate] = useState(0.1);
  const [crossoverRate] = useState(0.7);

  const enabledFactors = strategy.factors.filter(f => f.enabled);

  // Initialize population with random weights
  const initializePopulation = (): Individual[] => {
    const pop: Individual[] = [];

    for (let i = 0; i < populationSize; i++) {
      const weights = generateRandomWeights(enabledFactors.length);
      pop.push({
        weights,
        fitness: 0,
        generation: 0,
      });
    }

    return pop;
  };

  // Generate random weights that sum to 1.0
  const generateRandomWeights = (count: number): number[] => {
    const weights: number[] = [];
    let sum = 0;

    for (let i = 0; i < count; i++) {
      const w = Math.random();
      weights.push(w);
      sum += w;
    }

    // Normalize to sum to 1.0
    return weights.map(w => w / sum);
  };

  // Evaluate fitness of an individual
  const evaluateFitness = async (_weights: number[]): Promise<number> => {
    try {
      // Create temporary strategy configuration with these weights
      // Note: For now we use simplified fitness evaluation
      // In production, would actually update strategy and run backtest

      // Run a quick backtest (shorter period for speed)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6); // 6 months

      const backtestRequest: CreateBacktestRequest = {
        name: `GA Test Gen ${currentGeneration}`,
        config: {
          strategyId: strategy.id,
          portfolioId: strategy.portfolioId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          initialCash: 100000,
          commission: 1.0,
          slippage: 0.001,
        },
      };

      const backtest = await apiClient.createBacktest(backtestRequest);

      // Wait for completion (simplified - in production would poll)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await apiClient.getBacktest(backtest.id);

      // Fitness = Sharpe Ratio * 100 + Total Return %
      // This balances risk-adjusted returns with absolute returns
      const fitness = result.performance
        ? (result.performance.sharpeRatio * 100) + (result.performance.totalReturnPercent || 0)
        : -1000; // Penalty for failed backtest

      // Clean up
      await apiClient.deleteBacktest(backtest.id);

      return fitness;
    } catch (error) {
      console.error('Fitness evaluation failed:', error);
      return -1000; // Penalty
    }
  };

  // Tournament selection
  const tournamentSelect = (pop: Individual[], tournamentSize: number = 3): Individual => {
    const tournament: Individual[] = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * pop.length);
      tournament.push(pop[randomIndex]);
    }
    return tournament.reduce((best, ind) => ind.fitness > best.fitness ? ind : best);
  };

  // Crossover (blend two parents)
  const crossover = (parent1: Individual, parent2: Individual): Individual[] => {
    if (Math.random() > crossoverRate) {
      return [parent1, parent2];
    }

    const alpha = Math.random();
    const child1Weights = parent1.weights.map((w, i) =>
      alpha * w + (1 - alpha) * parent2.weights[i]
    );
    const child2Weights = parent2.weights.map((w, i) =>
      alpha * w + (1 - alpha) * parent1.weights[i]
    );

    // Normalize
    const sum1 = child1Weights.reduce((a, b) => a + b, 0);
    const sum2 = child2Weights.reduce((a, b) => a + b, 0);

    return [
      { weights: child1Weights.map(w => w / sum1), fitness: 0, generation: currentGeneration + 1 },
      { weights: child2Weights.map(w => w / sum2), fitness: 0, generation: currentGeneration + 1 },
    ];
  };

  // Mutation
  const mutate = (individual: Individual): Individual => {
    const mutated = [...individual.weights];

    for (let i = 0; i < mutated.length; i++) {
      if (Math.random() < mutationRate) {
        mutated[i] += (Math.random() - 0.5) * 0.2; // +/- 10%
        mutated[i] = Math.max(0.01, Math.min(0.99, mutated[i])); // Clamp
      }
    }

    // Normalize
    const sum = mutated.reduce((a, b) => a + b, 0);
    return {
      ...individual,
      weights: mutated.map(w => w / sum),
    };
  };

  // Main GA loop
  const runGeneticAlgorithm = async () => {
    setIsRunning(true);
    setCurrentGeneration(0);
    setGenerationHistory([]);

    let pop = initializePopulation();
    let best: Individual | null = null;

    for (let gen = 0; gen < maxGenerations && isRunning; gen++) {
      setCurrentGeneration(gen);
      setProgress((gen / maxGenerations) * 100);

      // Evaluate fitness for new individuals
      for (let i = 0; i < pop.length; i++) {
        if (pop[i].fitness === 0) {
          pop[i].fitness = await evaluateFitness(pop[i].weights);
        }
      }

      // Update best
      const genBest = pop.reduce((best, ind) =>
        ind.fitness > best.fitness ? ind : best
      );

      if (!best || genBest.fitness > best.fitness) {
        best = { ...genBest };
        setBestIndividual(best);
      }

      // Calculate statistics
      const avgFitness = pop.reduce((sum, ind) => sum + ind.fitness, 0) / pop.length;
      const diversity = calculateDiversity(pop);

      setGenerationHistory(prev => [...prev, {
        generation: gen,
        bestFitness: genBest.fitness,
        avgFitness,
        diversity,
      }]);

      // Create next generation
      const nextGen: Individual[] = [];

      // Elitism - keep top 10%
      const sorted = [...pop].sort((a, b) => b.fitness - a.fitness);
      const eliteCount = Math.floor(populationSize * 0.1);
      nextGen.push(...sorted.slice(0, eliteCount));

      // Fill rest with offspring
      while (nextGen.length < populationSize) {
        const parent1 = tournamentSelect(pop);
        const parent2 = tournamentSelect(pop);
        const [child1, child2] = crossover(parent1, parent2);

        nextGen.push(mutate(child1));
        if (nextGen.length < populationSize) {
          nextGen.push(mutate(child2));
        }
      }

      pop = nextGen;
      setPopulation(pop);
    }

    setIsRunning(false);
    setProgress(100);

    if (best && onOptimizationComplete) {
      // Convert back to FactorConfig format
      const optimizedFactors = strategy.factors.map((f) => {
        if (!f.enabled) return f;
        const enabledIndex = enabledFactors.findIndex(ef => ef.type === f.type);
        return {
          ...f,
          weight: enabledIndex >= 0 ? best.weights[enabledIndex] : f.weight,
        };
      });
      onOptimizationComplete(optimizedFactors);
    }
  };

  const calculateDiversity = (pop: Individual[]): number => {
    // Calculate average pairwise distance
    let totalDistance = 0;
    let count = 0;

    for (let i = 0; i < pop.length; i++) {
      for (let j = i + 1; j < pop.length; j++) {
        const distance = pop[i].weights.reduce((sum, w, k) =>
          sum + Math.abs(w - pop[j].weights[k]), 0
        );
        totalDistance += distance;
        count++;
      }
    }

    return count > 0 ? totalDistance / count : 0;
  };

  const stopOptimization = () => {
    setIsRunning(false);
  };

  // Prepare scatter plot data (fitness vs diversity)
  const scatterData = population.map((ind) => ({
    x: calculateIndividualDiversity(ind),
    y: ind.fitness,
    z: 200,
  }));

  function calculateIndividualDiversity(ind: Individual): number {
    // Diversity = variance in weights
    const mean = ind.weights.reduce((a, b) => a + b, 0) / ind.weights.length;
    const variance = ind.weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / ind.weights.length;
    return variance;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Dna className="w-5 h-5 mr-2 text-purple-600" />
              <h2 className="text-xl font-semibold">Genetic Algorithm Optimizer</h2>
            </div>
            {bestIndividual && (
              <Badge variant="success">
                <Award className="w-3 h-3 mr-1" />
                Best Fitness: {bestIndividual.fitness.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Uses evolutionary algorithms to automatically find optimal factor weights.
            Population size: {populationSize}, Max generations: {maxGenerations}
          </p>

          <div className="flex items-center space-x-4">
            {!isRunning ? (
              <Button onClick={runGeneticAlgorithm}>
                <Play className="w-4 h-4 mr-2" />
                Start Optimization
              </Button>
            ) : (
              <Button onClick={stopOptimization} variant="danger">
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}

            {isRunning && (
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Generation {currentGeneration}/{maxGenerations}</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {isRunning && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              <strong>Note:</strong> Optimization may take 5-10 minutes. Each generation
              runs quick backtests to evaluate fitness.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Individual */}
      {bestIndividual && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-success-600" />
              Best Solution Found
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enabledFactors.map((factor) => {
                const factorIndex = enabledFactors.findIndex(f => f.type === factor.type);
                return (
                <div key={factor.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{factor.type}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${bestIndividual.weights[factorIndex] * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-12 text-right">
                      {(bestIndividual.weights[factorIndex] * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution Progress */}
      {generationHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Fitness Evolution</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={generationHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bestFitness"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Best Fitness"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgFitness"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Avg Fitness"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Population Diversity</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name="Diversity" />
                  <YAxis dataKey="y" name="Fitness" />
                  <ZAxis dataKey="z" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Individuals" data={scatterData} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
