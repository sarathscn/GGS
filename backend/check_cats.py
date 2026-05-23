import asyncio
import pprint
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    cats = await db.categories.find({}).to_list(100)
    for c in cats:
        print(f"Category: {c.get('name')}, Slug: {c.get('slug')}, Image: {c.get('image_url')}")
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
