from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import router as api_router
from app.core.logging_config import setup_logging, get_logger
import time

# Initialize logging
setup_logging()
logger = get_logger(__name__)

app = FastAPI()

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Log all HTTP exceptions based on severity."""
    # Log different levels based on status code
    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code}: {request.method} {request.url.path} | "
            f"Detail: {exc.detail}",
            exc_info=True
        )
    elif exc.status_code >= 400:
        logger.info(
            f"HTTP {exc.status_code}: {request.method} {request.url.path} | "
            f"Detail: {exc.detail}"
        )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time."""
    start_time = time.time()
    
    # Log incoming request with client info to track duplicates
    client_host = request.client.host if request.client else "unknown"
    logger.info(
        f"Incoming request: {request.method} {request.url.path} | "
        f"Client: {client_host}"
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Check if response is an error and log with detail
        if response.status_code >= 400:
            # For error responses, try to read the body to get detail
            import json
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            # Reconstruct the response with the body we just read
            from starlette.responses import Response
            response = Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
            
            # Try to parse the error detail
            try:
                error_detail = json.loads(body.decode())
                detail_str = error_detail.get("detail", "No detail")
            except:
                detail_str = "Could not parse detail"
            
            # Log based on status code
            if response.status_code >= 500:
                logger.error(
                    f"HTTP {response.status_code}: {request.method} {request.url.path} | "
                    f"Detail: {detail_str} | Duration: {process_time:.3f}s"
                )
            elif response.status_code >= 400:
                logger.info(
                    f"⚠️ HTTP {response.status_code}: {request.method} {request.url.path} | "
                    f"Detail: {detail_str} | Duration: {process_time:.3f}s"
                )
        else:
            # Log success response
            logger.info(
                f"Request completed: {request.method} {request.url.path} | "
                f"Status: {response.status_code} | Duration: {process_time:.3f}s"
            )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} | "
            f"Error: {str(e)} | Duration: {process_time:.3f}s",
            exc_info=True
        )
        raise


app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    logger.debug("Root endpoint accessed")
    return {"message": "Welcome to the Postpartum Service Management API"}


@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info("Application starting up")
    logger.info("All routes and dependencies initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("Application shutting down")
