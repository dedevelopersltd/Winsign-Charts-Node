const axios = require("axios");

const thread_endpoint =
  "https://ujqlelgtkc.execute-api.us-west-2.amazonaws.com/api/v1/threads";


  const get_thread = async (req, res) => {
    try {
      const {account_id, user_id} = req.body;
      const response = await axios.post(thread_endpoint, { account_id: account_id, user_id: user_id });
      const chatbot_reply = response?.data;
      res.send(chatbot_reply);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error getting chatbot response",
        error: error,
      });
    }
  };
const chat_with_ai = async (req, res) => {
  try {
    const message = req.body.msg;
    const thread_id = req.body.thread_id;
    const chat_route = `https://ujqlelgtkc.execute-api.us-west-2.amazonaws.com/api/v1/threads/${thread_id}/msg`;
    // console.log(chat_route);
    const response = await axios.post(chat_route, { msg: message });
    const chatbot_reply = response.data.responses[0];
    // console.log(chatbot_reply);
    chatbot_reply.message = chatbot_reply.content[0].text.value;
    chatbot_reply.name = "AI Assistant";
    await delete chatbot_reply.content;

    res.send(chatbot_reply);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error getting chatbot response",
      error: error,
    });
  }
};

const update_threads = async (req, res) => {
  try {
    const score = req.body.score;
    const thread_id = req.body.thread_id;
    const account_id = req.body.account_id;
    const user_id = req.body.user_id;
    const payload = {
      "id": thread_id, 
      "metadata": {
        "account_id": account_id,
        "user_id": user_id,
        "survey_score": score.toString()
      }
    }
    // console.log("Payload DATA", payload);
    const chat_route = `https://ujqlelgtkc.execute-api.us-west-2.amazonaws.com/api/v1/threads/${thread_id}`;
    console.log(chat_route);
    const response = await axios.put(chat_route, payload);

    // console.log("Response Score", response?.data?.metadata?.survey_score);
    // return
    // const chatbot_reply = response.data.responses[0];
    // // console.log(chatbot_reply);
    // chatbot_reply.message = chatbot_reply.content[0].text.value;
    // chatbot_reply.name = "AI Assistant";
    // await delete chatbot_reply.content;

    res.send(response?.data?.metadata?.survey_score);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error getting chatbot response",
      error: error,
    });
  }
};

module.exports = {
  chat_with_ai,
  get_thread,
  update_threads
};
