import express from "express";
import axios from "axios";
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(function (req, res, next) {
 res.header("Access-Control-Allow-Origin", "https://www.meinkredit-24.com");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, PATCH");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

const token = '0d2f2c27df53204e60947fd1581a0d6a3462d2fa1d7396cb1bf168596b4f9273';
const collectionId = '68c332924483c1bad715d476';
app.post('/order', async (req, res) => {
  const formData = req.body;
  const phoneFull = formData.Phone_full.replace(/\s+/g, '');
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  };

  const limit = 100;
  let offset = 0;
  let allItems = [];

  function generate8DigitNumber() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  async function generateUnique8DigitNumber(existingItems) {
    let uniqueNumber;
    let isUnique = false;
    while (!isUnique) {
      uniqueNumber = generate8DigitNumber();
      isUnique = !existingItems.some(
        item => item.fieldData["unique-id"] === uniqueNumber
      );
    }
    return uniqueNumber;
  }

  try {
    while (true) {
      const response = await axios.get(
        `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const items = response.data.items || [];
      allItems = allItems.concat(items);
      if (items.length < limit) break;
      offset += limit;
    }
    const foundItem = allItems.find(item => item.fieldData.name.replace(/\s+/g, '') === phoneFull);

    if (foundItem) {
      return res.status(400).json({
        error: 'Запис з таким номером вже існує',
        customerId: foundItem.fieldData["customer-id"]
      });
    } else {
      const uniqueId = await generateUnique8DigitNumber(allItems);
      const createItemOptions = {
        method: 'POST',
        url: `https://api.webflow.com/v2/collections/${collectionId}/items/live`,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        data: {
          isArchived: false,
          isDraft: false,
          fieldData: {
            name: phoneFull,
            slug: phoneFull.replace(/\+/g, ''),
            "full-name": formData["First-Name"] + ' ' + formData["Last-Name"],
            city: formData["City"],
            language: formData["Language"],
            sum: formData["Sum"],
            // "the-request-has-been-processed": false,
           'switch-green': false,
           'switch-yellow': false,
           'switch-red': false,
           'switch-black': false,
            messenger: formData["Messenger"],
            "phone-number-or-nickname-in-messenger": formData["Nick"],
            status: "61da663c1046e1c2a962dd15679ce3b1",
            "customer-id": uniqueId,
            period: formData["Period"],
            ...(formData["utm_source"] && { source: formData["utm_source"] }),
            ...(formData["utm_campaign"] && { campaign: formData["utm_campaign"] }),
            ...(formData["utm_content"] && { content: formData["utm_content"] })
          },
        },
      };

      axios.request(createItemOptions)
        .then(() => {
          res.status(200).json({ customerId: uniqueId });
        })
        .catch(err => {
          console.error('Помилка створення айтема:', err.response?.data || err.message);
          res.status(500).json({ error: "Помилка створення айтема" });
        });
    }
  } catch (error) {
    console.error('Помилка при зверненні до Webflow API:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Помилка сервера при пошуку номера' });
  }
});


app.post('/log-in', async (req, res) => {
  const formData = req.body;
  const phoneFull = formData.Phone_full.replace(/\s+/g, '');

  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  };

  const limit = 100;
  let offset = 0;
  let allItems = [];

  try {
    while (true) {
      const response = await axios.get(
        `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const items = response.data.items || [];
      allItems = allItems.concat(items);
      if (items.length < limit) break;
      offset += limit;
    }
    const foundItem = allItems.find(item => item.fieldData.name.replace(/\s+/g, '') === phoneFull);

    if (foundItem) {
      return res.status(200).json({
        success: true,
        user: foundItem.fieldData['full-name'],
        sum: foundItem.fieldData.sum,
        status: foundItem.fieldData.status,
        date: foundItem.createdOn,
        customerId: foundItem.fieldData['customer-id'],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }
  } catch (error) {
    console.error('Помилка при зверненні до Webflow API:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Помилка сервера при пошуку номера' });
  }
});


app.post('/save', async (req, res) => {
  const formData = req.body;
  const phoneFull = formData.phone.replace(/\s+/g, '');
  const statusText = formData.statusText;
  const isActiveG = formData.isActiveG;
  const isActiveY = formData.isActiveY;
  const isActiveR = formData.isActiveR;
  const isActiveB = formData.isActiveB;
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  };
  const limit = 100;
  let offset = 0;
  let allItems = [];
  try {
    while (true) {
      const response = await axios.get(
        `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const items = response.data.items || [];
      allItems = allItems.concat(items);
      if (items.length < limit) break;
      offset += limit;
    }
    const foundItem = allItems.find(
      item => item.fieldData?.name?.replace(/\s+/g, '') === phoneFull
    );

    if (foundItem) {
      const updateOptions = {
        method: 'PATCH',
        url: `https://api.webflow.com/v2/collections/${collectionId}/items/${foundItem.id}/live`,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        data: {
          isArchived: false,
          isDraft: false,
          fieldData: {
            name: phoneFull,
            slug: phoneFull.replace(/\+/g, ''),
            status: statusText,
            // 'the-request-has-been-processed': isActive,
           'switch-green': isActiveG,
           'switch-yellow': isActiveY,
           'switch-red': isActiveR,
           'switch-black': isActiveB,
          },
        },
      };
      await axios.request(updateOptions);
      return res.status(200).json({ message: 'Дані успішно оновлено!' });
    } else {
      return res.status(404).json({ message: 'Елемент не знайдений' });
    }
  } catch (error) {
    console.error('Помилка при взаємодії з Webflow API:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Виникла помилка при обробці запиту' });
  }
});

app.post('/delete', async (req, res) => {
  const formData = req.body;
  const phoneFull = formData.phone.replace(/\s+/g, '');
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  };
  const limit = 100;
  let offset = 0;
  let allItems = [];
  try {
    while (true) {
      const response = await axios.get(
        `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const items = response.data.items || [];
      allItems = allItems.concat(items);
      if (items.length < limit) break;
      offset += limit;
    }
    const foundItem = allItems.find(item => item.fieldData.name.replace(/\s+/g, '') === phoneFull);
    if (!foundItem) {
      return res.status(404).json({ message: 'Елемент не знайдений' });
    }
    const itemId = foundItem.id;
    try {
      await axios.delete(
        `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}/live`,
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.warn('Не вдалося зняти з публікації (можливо вже в чернетках):', err.message);
    }
    await axios.delete(
      `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`,
      { headers }
    );
    return res.status(200).json({
      message: 'Елемент успішно повністю видалено',
    });
  } catch (error) {
    console.error('Помилка при взаємодії з Webflow API:', error.message);
    return res.status(500).json({ error: 'Виникла помилка при обробці запиту' });
  }
});

app.post('/delete-all', async (req, res) => {
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const limit = 100;
  let offset = 0;
  let allItems = [];
  try {
    while (true) {
      const response = await axios.get(
        `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const items = response.data.items || [];
      allItems = allItems.concat(items);
      if (items.length < limit) break;
      offset += limit;
    }
    if (allItems.length === 0) {
      return res.status(200).json({ message: 'Колекція вже порожня' });
    }
    let deletedCount = 0;
    let failed = [];
    for (const item of allItems) {
      const itemId = item.id;
      try {
        await axios.delete(
          `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}/live`,
          { headers }
        );
      } catch (err) {
      }
      try {
        await axios.delete(
          `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`,
          { headers }
        );
        deletedCount++;
      } catch (err) {
        failed.push({ id: itemId, error: err.message });
      }
    }
    return res.status(200).json({
      message: `Успішно видалено ${deletedCount} записів`,
      errors: failed,
    });
  } catch (error) {
    console.error('Помилка при масовому видаленні:', error.message);
    return res.status(500).json({ error: 'Виникла помилка при обробці запиту' });
  }
});

app.listen(PORT, () => console.log("Server on " + PORT))
