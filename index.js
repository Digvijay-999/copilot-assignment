#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import { program } from 'commander';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

async function fetchWeather(city, latitude, longitude) {
  try {
    console.log(chalk.blue(`\n🌤️  Fetching weather for ${city}...`));
    
    // Validate coordinates
    if (!latitude || !longitude) {
      throw new Error('Invalid city coordinates');
    }

    const response = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'kmh',
        timezone: 'auto'
      },
      timeout: 10000 // 10 second timeout
    });

    // Validate API response
    if (!response.data || !response.data.current) {
      throw new Error('Invalid response from weather API');
    }

    const current = response.data.current;
    
    // Validate required fields
    if (current.temperature_2m === undefined || current.relative_humidity_2m === undefined) {
      throw new Error('Missing weather data in API response');
    }

    displayWeather(city, current);
  } catch (error) {
    handleWeatherError(error, city);
  }
}

function handleWeatherError(error, city) {
  console.log();
  
  if (error.response) {
    // API returned an error status code
    if (error.response.status === 400) {
      console.error(chalk.red(`❌ Invalid city coordinates for "${city}"`));
    } else if (error.response.status === 404) {
      console.error(chalk.red(`❌ Weather service error: City not found`));
    } else if (error.response.status === 429) {
      console.error(chalk.red(`❌ API rate limit exceeded. Please try again later.`));
    } else if (error.response.status >= 500) {
      console.error(chalk.red(`❌ Weather service is temporarily unavailable (${error.response.status})`));
    } else {
      console.error(chalk.red(`❌ API Error (${error.response.status}): ${error.response.statusText}`));
    }
  } else if (error.code === 'ECONNABORTED') {
    console.error(chalk.red(`❌ Request timeout: Weather service is taking too long to respond`));
    console.error(chalk.yellow(`   Please check your internet connection and try again.`));
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error(chalk.red(`❌ Network error: Cannot reach the weather service`));
    console.error(chalk.yellow(`   Please check your internet connection.`));
  } else if (error.message === 'Invalid response from weather API') {
    console.error(chalk.red(`❌ ${error.message}`));
    console.error(chalk.yellow(`   Weather service returned unexpected data.`));
  } else if (error.message === 'Invalid city coordinates') {
    console.error(chalk.red(`❌ ${error.message}`));
  } else if (error.message === 'Missing weather data in API response') {
    console.error(chalk.red(`❌ ${error.message}`));
  } else {
    console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
  }
  
  console.log();
  process.exit(1);
}

function displayWeather(city, data) {
  console.log(chalk.green.bold(`\n📍 Weather in ${city}`));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.yellow(`🌡️  Temperature: ${data.temperature_2m}°F`));
  console.log(chalk.cyan(`💨 Wind Speed: ${data.wind_speed_10m} km/h`));
  console.log(chalk.magenta(`💧 Humidity: ${data.relative_humidity_2m}%`));
  console.log(chalk.gray('─'.repeat(40)) + '\n');
}

// City coordinates mapping
const cities = {
  'New York': { lat: 40.7128, lon: -74.0060 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Tokyo': { lat: 35.6762, lon: 139.6503 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Sydney': { lat: -33.8688, lon: 151.2093 },
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'Delhi': { lat: 28.7041, lon: 77.1025 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
};

program
  .name('weather')
  .description('A simple CLI app to fetch current weather data')
  .version('1.0.0')
  .argument('[city]', 'City name to fetch weather for')
  .option('--list', 'List available cities')
  .action(async (city, options) => {
    if (options.list) {
      console.log(chalk.blue('\n📍 Available Cities:'));
      console.log(chalk.gray('─'.repeat(40)));
      Object.keys(cities).forEach((cityName) => {
        console.log(chalk.green(`  • ${cityName}`));
      });
      console.log(chalk.gray('─'.repeat(40)) + '\n');
      return;
    }

    if (!city) {
      console.log();
      console.log(chalk.cyan('📋 Weather CLI Application'));
      console.log();
      console.log(chalk.yellow('Usage:'));
      console.log(chalk.white(`  node index.js "<City Name>"`));
      console.log(chalk.white(`  node index.js --list`));
      console.log();
      console.log(chalk.yellow('Examples:'));
      console.log(chalk.white(`  node index.js "New York"`));
      console.log(chalk.white(`  node index.js "Mumbai"`));
      console.log();
      process.exit(0);
    }

    if (!cities[city]) {
      console.log();
      console.error(chalk.red(`❌ City not found: "${city}"`));
      console.log();
      console.log(chalk.yellow(`🔍 Did you mean one of these cities?`));
      const availableCities = Object.keys(cities);
      const suggestions = availableCities.slice(0, 5);
      suggestions.forEach((c) => console.log(chalk.cyan(`  • ${c}`)));
      console.log();
      console.log(chalk.white(`Use ${chalk.cyan('node index.js --list')} to see all available cities.`));
      console.log();
      process.exit(1);
    }

    const { lat, lon } = cities[city];
    await fetchWeather(city, lat, lon);
  });

program.parse(process.argv);
