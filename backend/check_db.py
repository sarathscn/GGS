import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

async def run():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    listings = await db.listings.find().to_list(10)
    print(f"Found {len(listings)} listings")
    if listings:
        print(f"Type of price: {type(listings[0].get('price'))}, Value: {listings[0].get('price')}")
    client.close()

if __name__ == '__main__':
    asyncio.run(run())
