# 03. 后端接口与前后端契约规范

## 1. 统一 API 响应格式 (Unified Response Envelope)

所有 HTTP 接口必须严格遵循以下 JSON 数据包结构：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success",
  "timestamp": 1724832000000
}
```

### 错误响应格式
```json
{
  "code": 40001,
  "data": null,
  "message": "月建参数无效，应为地支十二字之一",
  "details": [
    {
      "field": "month",
      "issue": "Invalid Ganzhi branch"
    }
  ],
  "timestamp": 1724832000000
}
```

## 2. 业务错误码字典 (Standard Error Codes)

| 错误码区间 | 归属分类 | 说明与典型示例 |
| :--- | :--- | :--- |
| `0` | 成功 | 操作正常完成 |
| `40000 ~ 40099` | 参数校验错误 | Zod Schema 校验不通过、缺少必填字段 |
| `40100 ~ 40199` | 认证鉴权错误 | 未登录、Token 过期、无权访问该资源 |
| `40400 ~ 40499` | 资源未找到 | 指定的卦例 ID、章节 ID 不存在 |
| `42900 ~ 42999` | 限流拦截 | 请求过于频繁 (Rate Limit Exceeded) |
| `50000 ~ 50099` | 系统内部错误 | 数据库异常、未捕获的计算运行时异常 |
