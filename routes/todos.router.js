import express from 'express';
import joi from 'joi';
import Todo from '../schemas/todo.schemas.js';

const router = express.Router();
// 할 일 생성 API의 요청 데이터 검증을 위한 Joi 스키마를 정의합니다.
const createTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

/** * 할일 등록 API * * */
router.post('/todos', async (req, res, next) => {
  try {
    // 클라이언트에게 전달받은 데이터를 검증합니다.
    const validateBody = await createTodoSchema.validateAsync(req.body);

    // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    const { value } = validateBody;

    // 1. 클라이언트로 부터 받아온 value 데이터를 가져온다.
    //   const { value } = req.body;

    // 1-5. 만약, 클라이언트에게 value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메세지를 전달한다.
    //   if (!value) {
    //     return res
    //       .status(400)
    //       .json({ errorMessage: "해야할 일(value) 데이터가 존재하지 않습니다." });
    //   }

    // 2. 해당하는 마지막 order 데이터를 조회한다.
    // findOne = 1개 데이터만 조회한다.
    // sort = 정렬한다. -> 어떤 컬럼을?
    const todoMaxOrder = await Todo.findOne().sort('-order').exec();

    // 3. 만약 존재한다면 현재 해야 할 일을 +1 하고 , order 데이터가 존재하지 않는다면, 1을 할당하낟
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // 4. 해야할 일 등록
    const todo = new Todo({ value, order });
    await todo.save(); // 실제로 저장

    // 5. 해야할 일을 클라이언트에게 반환한다.
    return res.status(201).json({ todo: todo });
  } catch (error) {
    next(error);
    // console.error(error);
    // // Joi 검증에서 에러가 발생하면, 클라이언트에게 에러 메시지를 전달합니다.
    // if (error.name === "ValidationError") {
    //   return res.status(400).json({ errorMessage: error.message });
    // }
    // // 그 외의 에러가 발생하면, 서버 에러로 처리합니다.
    // return res
    //   .status(500)
    //   .json({ errorMessage: "서버에서 에러가 발생하였습니다." });
  }
});

/** *해야할일 목록조회 API * * */
router.get('/todos', async (req, res, next) => {
  //1. 해야할 일 목록 조회를 진행한다.
  const todos = await Todo.find().sort('-order').exec();
  //2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.

  return res.status(200).json({ todos });
});
// /routes/todos.router.js

/** 순서 변경, 할 일 완료/해제, 할 일 내용 변경 **/
router.patch('/todos/:todoId', async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // 클라이언트가 전달한 순서, 완료 여부, 내용 데이터를 가져옵니다.
  const { order, done, value } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 todo 데이터입니다.' });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니니다.
    currentTodo.order = order;
  }
  if (done !== undefined) {
    // 변경하려는 '해야할 일'의 doneAt 값을 변경합니다.
    currentTodo.doneAt = done ? new Date() : null;
  }
  if (value) {
    // 변경하려는 '해야할 일'의 내용을 변경합니다.
    currentTodo.value = value;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

/** 할 일 삭제  API * * */
router.delete('/todos/:todoId', async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 해야할 일 정보입니다.' });
  }

  await Todo.deleteOne({ _id: todoId });
  return res.status(202).json({});
});

export default router;
