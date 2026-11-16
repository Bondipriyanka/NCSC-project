import argparse
from ultralytics import YOLO


def train_model(data_yaml: str, epochs: int = 50, imgsz: int = 640, batch: int = 8):
    model = YOLO("yolov8n.pt")
    model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project="runs/train",
        name="fruit_detector",
        exist_ok=True,
    )
    print("Training finished. Best model saved at runs/train/fruit_detector/weights/best.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a custom YOLOv8 fruit detector.")
    parser.add_argument("--data", type=str, required=True, help="Path to the dataset YAML file.")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs.")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size.")
    parser.add_argument("--batch", type=int, default=8, help="Batch size.")
    args = parser.parse_args()

    train_model(args.data, epochs=args.epochs, imgsz=args.imgsz, batch=args.batch)
