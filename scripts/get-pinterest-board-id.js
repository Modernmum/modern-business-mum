/**
 * Get Pinterest Board ID Helper
 * Run this after you get your Pinterest Access Token
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getPinterestBoards = async () => {
  if (!process.env.PINTEREST_ACCESS_TOKEN) {
    console.log('\n❌ No Pinterest access token found!');
    console.log('\nPlease add PINTEREST_ACCESS_TOKEN to your .env file first.');
    console.log('See PINTEREST-SETUP-GUIDE.md for instructions.\n');
    return;
  }

  try {
    console.log('\n🔍 Fetching your Pinterest boards...\n');

    const response = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: {
        'Authorization': `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`,
      }
    });

    const boards = response.data.items;

    console.log('📌 Your Pinterest Boards:\n');
    boards.forEach((board, index) => {
      console.log(`${index + 1}. ${board.name}`);
      console.log(`   Board ID: ${board.id}`);
      console.log(`   URL: https://pinterest.com${board.url || ''}`);
      console.log('');
    });

    const productivityBoard = boards.find(b =>
      b.name.toLowerCase().includes('productivity') ||
      b.name.toLowerCase().includes('notion')
    );

    if (productivityBoard) {
      console.log('✅ Found your Productivity board!');
      console.log(`\nAdd this to your .env file:`);
      console.log(`PINTEREST_BOARD_ID=${productivityBoard.id}`);
      console.log('');
    } else {
      console.log('💡 Choose a board from above and add its ID to .env:');
      console.log('PINTEREST_BOARD_ID=<board-id-here>');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.log('\nMake sure your Pinterest access token is valid.');
    console.log('See PINTEREST-SETUP-GUIDE.md for setup instructions.\n');
  }
};

getPinterestBoards();
