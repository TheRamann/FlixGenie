#!/usr/bin/env node

import TorrentSearchApi from 'torrent-search-api';
import chalk from 'chalk';
import { table } from 'table';
import inquirer from 'inquirer';
import open from 'open';
import cfonts from 'cfonts';


cfonts.say('FlixGenie', {
    font: 'block',
    align: 'center',
    colors: ['cyan'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: '80'
  });
  

console.log(`
${chalk.magentaBright.bold('Welcome to FlixGenie!')}
${chalk.cyanBright('Your gateway to torrents and streaming made simple.')}
`);

inquirer.prompt({
  name: "TorrentNameAlr",
  message: "Which torrent do you want?"
}).then(searchthisthing => {
  (async () => {
    TorrentSearchApi.enableProvider('ThePirateBay');
    const searchResults = await TorrentSearchApi.search(searchthisthing.TorrentNameAlr).catch(e => console.log(e));
    if (searchResults && searchResults.length > 0) {
      console.log(chalk.blue("\nSearch Results with IMDb Links from PirateBay:\n"));
      const torrentsWithImdb = searchResults.filter(torrent => torrent.provider === 'ThePirateBay' && torrent.imdb);

      if (torrentsWithImdb.length > 0) {
        const imdbIds = new Set();

        const { watchOption } = await inquirer.prompt({
          type: 'list',
          name: 'watchOption',
          message: 'How would you like to proceed?',
          choices: ['Download Torrent', 'Watch Online']
        });

        if (watchOption === 'Watch Online') {
          const choices = torrentsWithImdb.map(torrent => {
            const imdbId = torrent.imdb;
            const cleanedTitle = torrent.title.replace(/[^\w\s]/gi, '').split(' ').slice(0, 5).join(' ');
            const embedUrl = `https://vidsrc.xyz/embed/movie?imdb=${imdbId}`;

            if (imdbIds.has(imdbId)) {
              return null;
            }

            imdbIds.add(imdbId);
            return { name: `${cleanedTitle} (IMDb: ${imdbId})`, value: embedUrl };
          }).filter(item => item !== null);

          if (choices.length > 0) {
            inquirer.prompt({
              type: 'list',
              name: 'selectedTorrent',
              message: 'Which movie would you like to watch?',
              choices: choices
            }).then(answers => {
              const selectedUrl = answers.selectedTorrent;
              console.log(`Opening: ${selectedUrl}`);
              open(selectedUrl);
            });
          } else {
            console.log(chalk.red("No unique torrents found."));
          }
        } else if (watchOption === 'Download Torrent') {
          torrentsWithImdb.forEach(torrent => {
            const cleanedTitle = torrent.title.replace(/[^\w\s]/gi, '').split(' ').slice(0, 5).join(' ');
            const torrentData = [
              ['Torrent Title', torrent.title],
              ['Size', torrent.size],
              ['Seeds', torrent.seeds],
              ['Peers', torrent.peers],
              ['Provider', torrent.provider],
              ['Magnet Link', torrent.magnet]
            ];
            const output = table(torrentData, {
              columns: {
                0: { alignment: 'left', width: 20 },
                1: { alignment: 'left', width: 50 }
              }
            });
            console.log(chalk.yellow(`\nDownload "${cleanedTitle}" via magnet link:\n`));
            console.log(chalk.green(output));
          });
        }
      } else {
        console.log(chalk.red("No torrents found with IMDb links from PirateBay."));
      }
    } else {
      console.log(chalk.red("No results found."));
    }
    TorrentSearchApi.disableAllProviders();
  })();
});
