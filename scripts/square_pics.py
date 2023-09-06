import os
import argparse
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("-in", "--input_dir", help="Input directory containing pictures")
parser.add_argument("-out", "--output_dir", help="Output directory where to place cropped pictures")


def crop_image(image):
  if image.height == image.width:
    return image

  if image.height < image.width:
    # Crop from the left & right of the picture.
    surplus = image.width - image.height
    side_crop = surplus // 2
    # crop_box = (left, upper, right, lower)
    crop_box = (side_crop, 0, image.width-side_crop, image.height)
  else:  # image.width < image.height:
    # Crop from the otp & bottom of the picture.
    surplus = image.height - image.width
    side_crop = surplus // 2
    # crop_box = (left, upper, right, lower)
    crop_box = (0, side_crop, image.width, image.height-side_crop)

  return image.crop(crop_box)


def main():
  args = parser.parse_args()
  os.mkdir(args.output_dir)

  for input_file in os.listdir(args.input_dir):
    input_path = os.path.join(args.input_dir, input_file)
    cropped_image = crop_image(Image.open(input_path))
    output_path = os.path.join(args.output_dir, input_file)
    cropped_image.save(output_path)
    print("Cropped " + input_path)


if __name__ == "__main__":
    main()
